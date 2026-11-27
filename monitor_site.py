#!/usr/bin/env python3
"""Read-only daily smoke monitor for WORTHSY's live static site and free gateway.

No secrets, customer data, or write operations are used.
"""
from __future__ import annotations

import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

CHECKS = {
    "homepage": "https://www.worthsy.in/",
    "shop": "https://www.worthsy.in/shop.html",
    "sneakerhead": "https://www.worthsy.in/sneakerhead.html",
    "catalogue": "https://www.worthsy.in/products.json",
    "personalisation_api": "https://worthsy-jarvis-gateway.onrender.com/health",
}

def fetch(name: str, url: str) -> tuple[bool, str]:
    request = Request(url, headers={"User-Agent": "WORTHSY-Free-Monitor/1.0"})
    last_error = "unknown error"
    for attempt in range(2):
        try:
            with urlopen(request, timeout=100) as response:
                status = response.status
                body = response.read(2_000_000)
                if status < 200 or status >= 400:
                    return False, f"HTTP {status}"
                if name == "homepage" and b"WORTHSY" not in body.upper():
                    return False, "homepage response does not contain WORTHSY"
                if name == "catalogue":
                    try:
                        data = json.loads(body)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        return False, "products.json is not valid JSON"
                    if not isinstance(data, list) or not data:
                        return False, "products.json is not a non-empty product array"
                    return True, f"HTTP {status}; {len(data)} catalogue entries"
                if name == "personalisation_api":
                    try:
                        data = json.loads(body)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        return False, "health endpoint did not return JSON"
                    if data.get("status") != "ok":
                        return False, f"unexpected health payload: {data}"
                    return True, f"HTTP {status}; {data.get('products', '?')} API products"
                return True, f"HTTP {status}; {len(body)} bytes"
        except HTTPError as exc:
            last_error = f"HTTP {exc.code}"
            if exc.code < 500:
                break
        except (URLError, TimeoutError, OSError) as exc:
            last_error = str(exc)
        if attempt == 0:
            time.sleep(5)
    return False, last_error

def main() -> int:
    failures = []
    for name, url in CHECKS.items():
        ok, detail = fetch(name, url)
        print(f"{'OK' if ok else 'FAIL'} {name}: {detail}")
        if not ok:
            failures.append(name)
    if failures:
        print("WORTHSY smoke monitor failed: " + ", ".join(failures))
        return 1
    print(f"WORTHSY smoke monitor passed ({len(CHECKS)} checks).")
    return 0

if __name__ == "__main__":
    sys.exit(main())
