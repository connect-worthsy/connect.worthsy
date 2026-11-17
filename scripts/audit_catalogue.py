#!/usr/bin/env python3
"""Read-only integrity audit for WORTHSY's JSON product catalogues."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]
FILES = ("products.json", "sneakerhead-products.json")
TAG = "worthsy0d-21"
ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")

def rows_from(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("products"), list):
        return data["products"]
    raise ValueError(f"{path.name}: expected a JSON array or an object with a products array")

def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    seen_asins: dict[str, str] = {}
    total = 0
    for filename in FILES:
        path = ROOT / filename
        if not path.exists():
            if filename == "sneakerhead-products.json":
                warnings.append(f"{filename}: not present; skipped")
                continue
            errors.append(f"{filename}: required catalogue is missing")
            continue
        try:
            rows = rows_from(path)
        except (ValueError, json.JSONDecodeError) as exc:
            errors.append(str(exc))
            continue
        total += len(rows)
        for index, product in enumerate(rows, 1):
            where = f"{filename}:{index}"
            if not isinstance(product, dict):
                errors.append(f"{where}: product must be a JSON object")
                continue
            name = str(product.get("name") or product.get("model") or "").strip()
            if not name:
                errors.append(f"{where}: missing product name")
            raw_link = str(product.get("link") or product.get("url") or "").strip()
            if not raw_link:
                warnings.append(f"{where}: no affiliate URL")
                continue
            parsed = urlparse(raw_link)
            host = (parsed.hostname or "").lower().removeprefix("www.")
            if host == "amazon.in":
                parts = [p for p in parsed.path.split("/") if p]
                asin = ""
                for pos, part in enumerate(parts[:-1]):
                    if part.lower() == "dp":
                        asin = parts[pos + 1].upper()
                        break
                if not ASIN_RE.fullmatch(asin):
                    errors.append(f"{where}: Amazon URL must contain a valid /dp/ ASIN")
                else:
                    if asin in seen_asins:
                        errors.append(f"{where}: duplicate ASIN {asin} also in {seen_asins[asin]}")
                    else:
                        seen_asins[asin] = where
                if parse_qs(parsed.query).get("tag", [""])[0] != TAG:
                    errors.append(f"{where}: Amazon affiliate tag must be {TAG}")
            images = product.get("images")
            has_image = (isinstance(images, list) and any(str(x).startswith("https://") for x in images)) or any(
                str(product.get(key) or "").startswith("https://") for key in ("image", "imageUrl", "fallback_image")
            )
            if not has_image:
                warnings.append(f"{where}: no HTTPS product image")
    print(f"WORTHSY catalogue audit: {total} products checked")
    print(f"Unique Amazon ASINs: {len(seen_asins)}")
    print(f"Errors: {len(errors)} | Warnings: {len(warnings)}")
    for item in errors:
        print(f"ERROR: {item}")
    for item in warnings[:40]:
        print(f"WARNING: {item}")
    if len(warnings) > 40:
        print(f"... {len(warnings) - 40} additional warnings omitted")
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
