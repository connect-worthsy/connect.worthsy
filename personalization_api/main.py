"""WORTHSY's stateless, privacy-first recommendation API.

The API reads only the public affiliate catalogue in the repository. It does not
store customer profiles, browsing events, email addresses, or other personal data.
Customer preferences are sent from the browser for a single recommendation request
and are discarded after the response.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
AMAZON_TAG = "worthsy0d-21"
AWIN_ID = "3110404"

SYNONYMS = {
    "sneaker": ["sneakers", "shoe", "shoes", "footwear", "trainer", "trainers"],
    "sneakers": ["sneaker", "shoe", "shoes", "footwear", "trainer", "trainers"],
    "shoe": ["shoes", "sneaker", "sneakers", "footwear"],
    "shoes": ["shoe", "sneaker", "sneakers", "footwear"],
    "footwear": ["shoe", "shoes", "sneaker", "sneakers"],
    "mobile": ["phone", "smartphone"],
    "phone": ["mobile", "smartphone"],
    "laptop": ["notebook", "computer"],
    "earbuds": ["earphones", "tws", "headphones"],
    "headphones": ["headset", "earbuds"],
    "watch": ["smartwatch", "wearable"],
    "smartwatch": ["watch", "wearable"],
    "keyboard": ["keyboards"],
    "mouse": ["mice"],
}

KNOWN_BRANDS = [
    "Western Digital", "Amazon Basics", "DailyObjects", "TheGiftKart", "G.Skill",
    "TP-Link", "SanDisk", "Kingston", "Crucial", "Corsair", "Logitech", "Ambrane",
    "Portronics", "Zebronics", "Netgear", "Samsung", "OnePlus", "Xiaomi", "Realme",
    "Fastrack", "Philips", "Havells", "Wakefit", "Fujifilm", "Spigen", "boAt",
    "Noise", "Apple", "ASUS", "GIGABYTE", "Dell", "Lenovo", "Acer", "HP", "D-Link",
    "Tenda", "Seagate", "JBL", "Sony", "Anker", "UGREEN", "Qubo", "Wipro", "Syska",
    "Milton", "Tygot", "Fire-Boltt", "MSI", "Redragon", "Nothing", "CMF", "Sennheiser",
    "Tribit", "Google", "EZVIZ", "Nike", "adidas", "New Balance", "Puma", "Onitsuka Tiger", "Converse"
]


def infer_brand(item: dict[str, Any]) -> str:
    explicit = str(item.get("brand") or "").strip()
    if explicit and "amazon india" not in explicit.lower():
        return explicit
    name = normalise(item.get("name") or item.get("model"))
    for brand in sorted(KNOWN_BRANDS, key=len, reverse=True):
        if name == normalise(brand) or name.startswith(normalise(brand) + " "):
            return brand
    merchant = str(item.get("merchant") or "").strip()
    return "" if "amazon india" in merchant.lower() else merchant


OCCASION_TERMS = {
    "birthday": ["audio", "headphones", "speaker", "smartwatch", "gaming", "accessory", "phone"],
    "graduation": ["laptop", "tablet", "headphones", "keyboard", "mouse", "storage"],
    "anniversary": ["speaker", "audio", "smartwatch", "camera", "home"],
    "housewarming": ["home", "kitchen", "lighting", "speaker", "smart", "security"],
    "travel": ["power bank", "charger", "headphones", "earbuds", "bag", "camera"],
    "gaming": ["gaming", "console", "controller", "keyboard", "mouse", "headset"],
    "work": ["laptop", "keyboard", "mouse", "monitor", "webcam", "storage"],
}

app = FastAPI(
    title="WORTHSY Personalisation API",
    version="1.0.0",
    description="Stateless catalogue search and product recommendations for WORTHSY.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.worthsy.in",
        "https://worthsy.in",
        "https://connect-worthsy.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class Preferences(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=30)
    favourite_brands: list[str] = Field(default_factory=list, max_length=30)
    preferred_platforms: list[str] = Field(default_factory=list, max_length=10)
    budget_inr: int | None = Field(default=None, ge=0, le=10_000_000)


class RecommendRequest(BaseModel):
    preferences: Preferences = Field(default_factory=Preferences)
    recent_categories: list[str] = Field(default_factory=list, max_length=30)
    recent_brands: list[str] = Field(default_factory=list, max_length=30)
    wishlist_categories: list[str] = Field(default_factory=list, max_length=30)
    limit: int = Field(default=12, ge=1, le=30)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=160)
    limit: int = Field(default=24, ge=1, le=50)


class GiftRequest(BaseModel):
    occasion: str = Field(min_length=2, max_length=40)
    category: str | None = Field(default=None, max_length=80)
    budget_inr: int | None = Field(default=None, ge=0, le=10_000_000)
    limit: int = Field(default=12, ge=1, le=30)


class CompareRequest(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=4)


def normalise(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def approved_affiliate_url(raw: Any) -> str:
    """Return only a valid Amazon India or Awin destination; otherwise blank."""
    try:
        parsed = urlparse(str(raw or "").strip())
        host = (parsed.hostname or "").lower()
        query = parse_qs(parsed.query)
        parts = [part for part in parsed.path.split("/") if part]

        if host in {"amazon.in", "www.amazon.in"}:
            for index, part in enumerate(parts[:-1]):
                if (
                    part.lower() == "dp"
                    and re.fullmatch(r"[A-Z0-9]{10}", parts[index + 1], re.I)
                    and AMAZON_TAG in query.get("tag", [])
                ):
                    return parsed.geturl()

        if (
            host in {"awin1.com", "www.awin1.com"}
            and parsed.path == "/pclick.php"
            and AWIN_ID in query.get("a", [])
        ):
            return parsed.geturl()
    except (TypeError, ValueError):
        pass
    return ""


def product_price(product: dict[str, Any]) -> float | None:
    value = product.get("price")
    if isinstance(value, (int, float)) and value >= 0:
        return float(value)
    raw = str(value or "").replace(",", "")
    match = re.search(r"\d+(?:\.\d{1,2})?", raw)
    return float(match.group()) if match else None


def product_id(product: dict[str, Any]) -> str:
    link = approved_affiliate_url(
        product.get("link") or product.get("url") or product.get("amazonUrl")
        or product.get("awinUrl") or product.get("affiliateUrl")
    )
    identity = link or "|".join(
        [str(product.get("brand") or ""), str(product.get("name") or product.get("model") or "")]
    )
    return hashlib.sha256(identity.lower().encode("utf-8")).hexdigest()[:16]


def load_catalogue() -> list[dict[str, Any]]:
    main_path = ROOT / "products.json"
    sneaker_path = ROOT / "sneakerhead-products.json"
    main = json.loads(main_path.read_text(encoding="utf-8"))
    sneaker_data = json.loads(sneaker_path.read_text(encoding="utf-8"))
    sneakers = sneaker_data if isinstance(sneaker_data, list) else sneaker_data.get("products", [])

    catalogue: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in main if isinstance(main, list) else []:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        link = approved_affiliate_url(item.get("link") or item.get("url"))
        if not link:
            continue
        row = dict(item)
        row.update({
            "id": product_id(item),
            "name": str(item.get("name", "")).strip(),
            "brand": infer_brand(item),
            "category": str(item.get("category") or "Other").strip(),
            "platform": "Amazon" if "amazon.in" in link else "Awin",
            "link": link,
            "image": (
                (item.get("images") or [""])[0]
                if isinstance(item.get("images"), list)
                else item.get("image") or ""
            ),
            "price_value": product_price(item),
            "is_sneaker": False,
        })
        if row["id"] not in seen:
            catalogue.append(row)
            seen.add(row["id"])

    for item in sneakers if isinstance(sneakers, list) else []:
        if not isinstance(item, dict) or not (item.get("name") or item.get("model")):
            continue
        raw_link = item.get("amazonUrl") or item.get("awinUrl") or item.get("affiliateUrl")
        link = approved_affiliate_url(raw_link)
        row = {
            "id": product_id(item),
            "name": str(item.get("name") or item.get("model") or "").strip(),
            "brand": str(item.get("brand") or "").strip(),
            "category": str(item.get("category") or "Sneakers").strip(),
            "platform": "Amazon" if link and "amazon.in" in link else ("Awin" if link else "Affiliate link pending"),
            "link": link,
            "image": str(item.get("imageUrl") or ""),
            "price": item.get("price") or "",
            "price_value": product_price(item),
            "description": "Sneaker discovery edit",
            "is_sneaker": True,
        }
        if row["id"] not in seen:
            catalogue.append(row)
            seen.add(row["id"])
    return catalogue


CATALOGUE = load_catalogue()
BY_ID = {item["id"]: item for item in CATALOGUE}


def words(text: str) -> list[str]:
    return [part for part in normalise(text).split() if len(part) > 1]


def score_search(product: dict[str, Any], query: str) -> int:
    tokens = words(query)
    if not tokens:
        return 0
    name = normalise(product.get("name"))
    brand = normalise(product.get("brand"))
    category = normalise(product.get("category"))
    platform = normalise(product.get("platform"))
    description = normalise(product.get("description"))
    haystack = " ".join([name, brand, category, platform, description])
    score = 0
    for token in tokens:
        variants = [token] + SYNONYMS.get(token, [])
        if any(variant in name for variant in variants):
            score += 10
        elif any(variant in brand for variant in variants):
            score += 8
        elif any(variant in category for variant in variants):
            score += 6
        elif any(variant in platform for variant in variants):
            score += 4
        elif any(variant in haystack for variant in variants):
            score += 2
    if len(tokens) > 1 and normalise(query) in name:
        score += 10
    if product.get("is_sneaker") and any(
        token in {"sneaker", "sneakers", "shoe", "shoes", "footwear", "trainer", "trainers"}
        for token in tokens
    ):
        score += 10
    return score


def recommendation_reason(product: dict[str, Any], prefs: Preferences, request: RecommendRequest) -> list[str]:
    reasons: list[str] = []
    category = normalise(product.get("category"))
    brand = normalise(product.get("brand"))
    platform = normalise(product.get("platform"))

    if any(normalise(value) == category for value in prefs.interests):
        reasons.append("Matches an interest you selected")
    if any(normalise(value) == brand for value in prefs.favourite_brands):
        reasons.append("From one of your favourite brands")
    if any(normalise(value) == platform for value in prefs.preferred_platforms):
        reasons.append("Available through a platform you prefer")
    if category in {normalise(x) for x in request.recent_categories}:
        reasons.append("Related to categories you recently explored")
    if brand in {normalise(x) for x in request.recent_brands}:
        reasons.append("Related to a brand you recently explored")
    if category in {normalise(x) for x in request.wishlist_categories}:
        reasons.append("Similar to a category in your saved list")

    price = product.get("price_value")
    if prefs.budget_inr is not None and price is not None and price <= prefs.budget_inr:
        reasons.append("Has a listed price within your selected budget")
    return reasons or ["A product from the WORTHSY catalogue"]


def score_recommendation(product: dict[str, Any], request: RecommendRequest) -> int:
    prefs = request.preferences
    score = 0
    category = normalise(product.get("category"))
    brand = normalise(product.get("brand"))
    platform = normalise(product.get("platform"))
    if category and category in {normalise(x) for x in prefs.interests}:
        score += 30
    if brand and brand in {normalise(x) for x in prefs.favourite_brands}:
        score += 25
    if platform and platform in {normalise(x) for x in prefs.preferred_platforms}:
        score += 10
    if category and category in {normalise(x) for x in request.recent_categories}:
        score += 18
    if brand and brand in {normalise(x) for x in request.recent_brands}:
        score += 12
    if category and category in {normalise(x) for x in request.wishlist_categories}:
        score += 14

    if prefs.budget_inr is not None:
        price = product.get("price_value")
        if price is not None:
            score += 20 if price <= prefs.budget_inr else -25

    if product.get("is_sneaker") and category in {normalise(x) for x in prefs.interests}:
        score += 5
    return score


def public_product(product: dict[str, Any], reasons: list[str] | None = None) -> dict[str, Any]:
    return {
        "id": product["id"],
        "name": product["name"],
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "platform": product.get("platform", ""),
        "price": product.get("price") or "",
        "price_known": product.get("price_value") is not None,
        "image": product.get("image") or "",
        "link": product.get("link") or "",
        "is_sneaker": bool(product.get("is_sneaker")),
        "reasons": reasons or [],
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "worthsy-personalization",
        "products": len(CATALOGUE),
        "affiliate_only": True,
        "customer_data_stored": False,
    }


@app.get("/catalogue/stats")
def catalogue_stats() -> dict[str, Any]:
    brands = sorted({item.get("brand", "") for item in CATALOGUE if item.get("brand")})
    categories = sorted({item.get("category", "") for item in CATALOGUE if item.get("category")})
    price_count = sum(item.get("price_value") is not None for item in CATALOGUE)
    return {
        "products": len(CATALOGUE),
        "brands": brands,
        "categories": categories,
        "products_with_price": price_count,
        "price_note": "Products without a verified catalogue price are not described as within budget.",
    }


@app.post("/search")
def search(request: SearchRequest) -> dict[str, Any]:
    ranked = [(score_search(item, request.query), item) for item in CATALOGUE]
    matches = [entry for entry in ranked if entry[0] > 0]
    matches.sort(key=lambda pair: (-pair[0], pair[1]["name"].lower()))
    return {
        "query": request.query,
        "count": len(matches),
        "items": [public_product(item) for _, item in matches[: request.limit]],
    }


@app.post("/recommend")
def recommend(request: RecommendRequest) -> dict[str, Any]:
    ranked = [(score_recommendation(item, request), item) for item in CATALOGUE]
    ranked.sort(key=lambda pair: (-pair[0], pair[1]["name"].lower()))
    items = []
    for _, item in ranked[: request.limit]:
        reasons = recommendation_reason(item, request.preferences, request)
        items.append(public_product(item, reasons))
    return {
        "items": items,
        "personalised": bool(
            request.preferences.interests
            or request.preferences.favourite_brands
            or request.preferences.preferred_platforms
            or request.preferences.budget_inr is not None
            or request.recent_categories
            or request.recent_brands
            or request.wishlist_categories
        ),
        "privacy": "This request is stateless; customer preferences are not stored by this API.",
    }


@app.post("/gift-finder")
def gift_finder(request: GiftRequest) -> dict[str, Any]:
    occasion = normalise(request.occasion)
    if occasion not in OCCASION_TERMS:
        raise HTTPException(status_code=422, detail="Choose a supported occasion.")
    terms = OCCASION_TERMS[occasion]
    query = " ".join(terms + ([request.category] if request.category else []))
    ranked = [(score_search(item, query), item) for item in CATALOGUE]
    ranked.sort(key=lambda pair: (-pair[0], pair[1]["name"].lower()))

    verified_within_budget = []
    price_unverified = []
    for score, item in ranked:
        if score <= 0:
            continue
        price = item.get("price_value")
        if request.budget_inr is None:
            verified_within_budget.append(item)
        elif price is not None and price <= request.budget_inr:
            verified_within_budget.append(item)
        elif price is None:
            price_unverified.append(item)

    results = verified_within_budget[: request.limit]
    return {
        "occasion": occasion,
        "items": [public_product(item) for item in results],
        "price_unverified": [public_product(item) for item in price_unverified[: request.limit]],
        "budget_note": (
            "Only products with a listed catalogue price are counted as within budget. "
            "Unpriced products are shown separately for you to check at the partner."
            if request.budget_inr is not None
            else "Check current partner prices and availability before purchasing."
        ),
    }


@app.post("/compare")
def compare(request: CompareRequest) -> dict[str, Any]:
    items = [BY_ID[item_id] for item_id in request.product_ids if item_id in BY_ID]
    if len(items) < 2:
        raise HTTPException(status_code=404, detail="Choose at least two products from the current catalogue.")
    return {
        "items": [
            {
                **public_product(item),
                "price_label": (
                    str(item.get("price") or "")
                    if item.get("price_value") is not None
                    else "Check current partner price"
                ),
            }
            for item in items
        ],
        "note": "Only catalogue fields are compared. Unavailable specifications and prices are not guessed.",
    }
