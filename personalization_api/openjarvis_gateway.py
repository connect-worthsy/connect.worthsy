"""WORTHSY customer-facing OpenJarvis gateway.

This route is deliberately fail-closed: it returns 503 until the private OpenJarvis
service is deployed and OPENJARVIS_ENABLED=true is set on the API host.
"""
from __future__ import annotations

import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=600)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=8)


@router.post("/openjarvis/chat")
async def openjarvis_chat(payload: ChatRequest, request: Request) -> dict[str, str]:
    if os.getenv("OPENJARVIS_ENABLED", "false").lower() != "true":
        raise HTTPException(status_code=503, detail="WORTHSY AI is not enabled on this environment.")
    base_url = os.getenv("OPENJARVIS_BASE_URL", "").rstrip("/")
    model = os.getenv("OPENJARVIS_MODEL", "").strip()
    if not base_url or not model:
        raise HTTPException(status_code=503, detail="The OpenJarvis service is not configured.")

    if payload.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="The last message must be from the customer.")

    query = payload.messages[-1].content
    # Only public, approved catalogue fields are sent to the model.
    from .main import CATALOGUE, public_product, score_search

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
    system = (
        "You are WORTHSY's customer shopping assistant. Help customers discover and compare "
        "products from the supplied catalogue context. Treat catalogue facts as the only source "
        "for product names, brands, prices, platform and links. Never invent availability, "
        "ratings, specifications, delivery promises, warranty terms or prices. If no matching "
        "catalogue item is supplied, say that you cannot verify a match and suggest searching "
        "WORTHSY. Do not ask for passwords, payment details, OTPs or authentication tokens. "
        "Be concise, useful and reply in the customer's language. Catalogue context: "
        + str(catalogue_context)
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
                    "max_tokens": 450,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            if not isinstance(reply, str) or not reply.strip():
                raise ValueError("Empty model response")
            return {"reply": reply.strip()[:4000]}
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        raise HTTPException(status_code=502, detail="The WORTHSY AI service is temporarily unavailable.")
