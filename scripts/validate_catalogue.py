#!/usr/bin/env python3
"""Validate WORTHSY's affiliate catalogue and shared website shell.

This runs in GitHub Actions before the static site is published.
It intentionally uses only Python's standard library.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
AMAZON_TAG = "worthsy0d-21"
AWIN_ID = "3110404"


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise SystemExit(f"ERROR: cannot read {path.relative_to(ROOT)}: {exc}")


def approved_affiliate(url: str) -> tuple[bool, str]:
    if not url:
        return False, "missing URL"
    try:
        parsed = urlparse(str(url).strip())
        host = (parsed.hostname or "").lower()
        query = parse_qs(parsed.query)
        parts = [part for part in parsed.path.split("/") if part]
        if host in {"amazon.in", "www.amazon.in"}:
            for index, part in enumerate(parts[:-1]):
                if part.lower() == "dp" and re.fullmatch(r"[A-Z0-9]{10}", parts[index + 1], re.I):
                    if AMAZON_TAG in query.get("tag", []):
                        return True, "Amazon"
                    return False, "Amazon link missing the current WORTHSY tracking tag"
            return False, "not an individual Amazon /dp/ product URL"
        if host in {"awin1.com", "www.awin1.com"} and parsed.path == "/pclick.php":
            if AWIN_ID in query.get("a", []):
                return True, "Awin"
            return False, "Awin link has the wrong publisher ID"
        return False, f"unapproved affiliate destination ({host or 'no host'})"
    except Exception as exc:
        return False, f"invalid URL ({exc})"


def main() -> int:
    products = load_json(ROOT / "products.json")
    if not isinstance(products, list) or not products:
        raise SystemExit("ERROR: products.json must contain a non-empty JSON array")

    bad = []
    platforms = {"Amazon": 0, "Awin": 0}
    for index, product in enumerate(products):
        if not isinstance(product, dict) or not product.get("name"):
            bad.append(f"products.json[{index}] has no product name")
            continue
        ok, kind = approved_affiliate(product.get("link") or product.get("url") or "")
        if not ok:
            bad.append(f"{product.get('name')}: {kind}")
        else:
            platforms[kind] += 1

    if bad:
        print("ERROR: affiliate catalogue validation failed:")
        for item in bad[:30]:
            print(" - " + item)
        if len(bad) > 30:
            print(f" - ... and {len(bad) - 30} more")
        return 1

    sneaker_data = load_json(ROOT / "sneakerhead-products.json")
    sneakers = sneaker_data if isinstance(sneaker_data, list) else sneaker_data.get("products", [])
    if not isinstance(sneakers, list) or not sneakers:
        raise SystemExit("ERROR: sneakerhead-products.json has no product array")

    linked_sneakers = 0
    for index, product in enumerate(sneakers):
        if not isinstance(product, dict) or not (product.get("name") or product.get("model")):
            raise SystemExit(f"ERROR: sneakerhead-products.json[{index}] has no product name")
        amazon = product.get("amazonUrl") or ""
        awin = product.get("awinUrl") or product.get("affiliateUrl") or ""
        if amazon:
            ok, reason = approved_affiliate(amazon)
            if not ok:
                raise SystemExit(f"ERROR: sneaker {product.get('name')}: {reason}")
            linked_sneakers += 1
        elif awin:
            ok, reason = approved_affiliate(awin)
            if not ok:
                raise SystemExit(f"ERROR: sneaker {product.get('name')}: {reason}")
            linked_sneakers += 1

    pages = ["index.html", "sneakerhead.html", "shop.html", "about.html", "career.html", "blog.html", "brand.html"]
    for filename in pages:
        path = ROOT / filename
        if not path.exists():
            raise SystemExit(f"ERROR: required page missing: {filename}")
        html = path.read_text(encoding="utf-8")
        if 'class="worthsy-header wx-header' not in html:
            raise SystemExit(f"ERROR: {filename} is missing the shared WORTHSY header")
        if html.count('id="uniSearchBtn"') != 1:
            raise SystemExit(f"ERROR: {filename} must contain exactly one universal search button")
        if "worthsy-universal-nav.css" not in html or "worthsy-universal-nav.js" not in html:
            raise SystemExit(f"ERROR: {filename} is not loading the shared header assets")
        if "worthsy-search.js" not in html:
            raise SystemExit(f"ERROR: {filename} is not loading the universal search engine")

    search_js = (ROOT / "worthsy-search.js").read_text(encoding="utf-8")
    if "sneakerhead-products.json" not in search_js or "approvedAffiliateLink" not in search_js:
        raise SystemExit("ERROR: universal search must index the sneaker catalogue and validate affiliate links")

    print("WORTHSY validation passed")
    print(f"Main catalogue: {len(products)} products ({platforms['Amazon']} Amazon, {platforms['Awin']} Awin)")
    print(f"Sneaker catalogue: {len(sneakers)} products ({linked_sneakers} affiliate-linked; remaining entries stay searchable but cannot link to non-partner stores)")
    print(f"Shared header/search checked on {len(pages)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
