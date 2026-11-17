"""WORTHSY customer-facing OpenJarvis gateway."""
from __future__ import annotations

import os
import re
import time
from collections import defaultdict, deque
from html.parser import HTMLParser
from pathlib import Path
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter()

_ALLOWED_ORIGINS = {"https://www.worthsy.in", "https://worthsy.in"}
_RATE_WINDOW_SECONDS = 60
_RATE_LIMIT = 20
_REQUESTS: dict[str, deque[float]] = defaultdict(deque)
_SITE_PAGES = (
    "index.html", "shop.html", "about.html", "career.html",
    "blog.html", "brand.html", "sneakerhead.html",
)


class _VisibleText(HTMLParser):
    """Extract readable copy from visible content, ignoring scripts and styles."""
    _BLOCKS = {"h1", "h2", "h3", "p", "li", "dt", "dd", "summary"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.active_tag: str | None = None
        self.parts: list[str] = []
        self.blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.active_tag is None and tag in self._BLOCKS:
            self.active_tag = tag
            self.parts = []

    def handle_endtag(self, tag: str) -> None:
        if self.active_tag == tag:
            value = re.sub(r"\\s+", " ", " ".join(self.parts)).strip()
            if value and len(value) <= 700:
                self.blocks.append(value)
            self.active_tag = None
            self.parts = []

    def handle_data(self, data: str) -> None:
        if self.active_tag is not None:
            self.parts.append(data)


def _website_context(query: str, root: Path) -> str:
    """Retrieve relevant public copy from WORTHSY pages for each AI answer."""
    terms = {word for word in re.findall(r"[a-z0-9]+", query.lower()) if len(word) > 2}
    ranked: list[tuple[int, str, str]] = []
    for filename in _SITE_PAGES:
        path = root / filename
        if not path.is_file():
            continue
        try:
            parser = _VisibleText()
            parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        except (OSError, ValueError):
            continue
        title = filename.removesuffix(".html")
        for block in parser.blocks:
            words = set(re.findall(r"[a-z0-9]+", block.lower()))
            score = len(terms & words)
            if score:
                ranked.append((score, title, block))
    ranked.sort(key=lambda item: item[0], reverse=True)
    selected: list[str] = []
    seen: set[str] = set()
    for _, page, block in ranked:
        key = block.casefold()
        if key in seen:
            continue
        seen.add(key)
        selected.append(f"[{page}] {block}")
        if len(selected) >= 14:
            break
    return "\\n".join(selected) if selected else "No directly relevant page copy was found."


def _check_origin_and_rate_limit(request: Request) -> None:
    origin = request.headers.get("origin", "")
    if origin not in _ALLOWED_ORIGINS:
        raise HTTPException(status_code=403, detail="This origin is not allowed.")
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    bucket = _REQUESTS[client_ip]
    while bucket and now - bucket[0] > _RATE_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many messages. Please try again shortly.")
    bucket.append(now)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=600)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=8)


@router.post("/openjarvis/chat")
async def openjarvis_chat(payload: ChatRequest, request: Request) -> dict[str, str]:
    _check_origin_and_rate_limit(request)
    if os.getenv("OPENJARVIS_ENABLED", "false").lower() != "true":
        raise HTTPException(status_code=503, detail="WORTHSY AI is not enabled on this environment.")
    base_url = os.getenv("OPENJARVIS_BASE_URL", "").rstrip("/")
    model = os.getenv("OPENJARVIS_MODEL", "").strip()
    if not base_url or not model:
        raise HTTPException(status_code=503, detail="The OpenJarvis service is not configured.")
    if payload.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="The last message must be from the customer.")

    query = payload.messages[-1].content
    from .main import CATALOGUE, ROOT, score_search

    ranked = [(score_search(item, query), item) for item in CATALOGUE]
    ranked = sorted((pair for pair in ranked if pair[0] > 0), key=lambda pair: -pair[0])[:8]
    catalogue_context = [
        {
            "name": item["name"],
            "brand": item.get("brand", ""),
            "category": item.get("category", ""),
            "platform": item.get("platform", ""),
            "price": item.get("price") or "Not listed",
            "product_url": item.get("link", ""),
        }
        for _, item in ranked
    ]
    website_context = _website_context(query, ROOT)
    system = (
        "You are JARVIS, WORTHSY's AI website and shopping assistant. Answer questions "
        "about WORTHSY's pages, shopping experience, brands, products, published shipping, "
        "returns, refunds, privacy, payments, careers and blog using the retrieved website "
        "copy and catalogue context. You may also answer ordinary general questions helpfully. "
        "For WORTHSY-specific facts, treat the supplied page copy and catalogue as the source "
        "of truth. Never invent prices, stock, ratings, product specifications, order status, "
        "delivery dates, warranty terms, policy exceptions, or contact details. If the source "
        "does not contain an answer, say what cannot be verified and direct the visitor to the "
        "relevant WORTHSY page or support section. Distinguish published site information from "
        "general advice. Never request passwords, OTPs, payment card details, or authentication "
        "tokens. Reply in the customer's language, clearly and conversationally.\n\n"
        "RELEVANT WORTHSY WEBSITE COPY:\\n" + website_context +
        "\\n\\nMATCHING PUBLIC CATALOGUE ITEMS:\\n" + str(catalogue_context)
    )
    messages = [{"role": "system", "content": system}] + [
        {"role": message.role, "content": message.content}
        for message in payload.messages
    ]
    headers = {"Content-Type": "application/json"}
    token = os.getenv("OPENJARVIS_API_KEY", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(35.0, connect=5.0)) as client:
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 700,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            if not isinstance(reply, str) or not reply.strip():
                raise ValueError("Empty model response")
            return {"reply": reply.strip()[:5000]}
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=503,
                detail="WORTHSY AI is temporarily unavailable. Please try again shortly.",
            ) from exc
        raise HTTPException(status_code=502, detail="The WORTHSY AI service is temporarily unavailable.") from exc
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="The WORTHSY AI service is temporarily unavailable.") from exc
