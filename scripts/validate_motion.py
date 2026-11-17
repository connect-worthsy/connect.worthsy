#!/usr/bin/env python3
"""Static regression checks for WORTHSY's shared motion system."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = ("index.html", "shop.html", "sneakerhead.html", "brand.html", "about.html", "career.html", "blog.html")
errors = []
for name in PAGES:
    path = ROOT / name
    if not path.is_file():
        errors.append(f"Missing page: {name}")
        continue
    html = path.read_text(encoding="utf-8")
    if not re.search(r'worthsy-universal-nav\\.js\\?v=17', html):
        errors.append(f"{name}: shared navigation loader v17 missing")
for name in ("worthsy-motion.css", "worthsy-motion.js", "worthsy-universal-nav.js"):
    if not (ROOT / name).is_file():
        errors.append(f"Missing shared motion asset: {name}")
nav = (ROOT / "worthsy-universal-nav.js").read_text(encoding="utf-8")
for asset in ("worthsy-motion.css?v=5", "worthsy-motion.js?v=7"):
    if asset not in nav:
        errors.append(f"Motion loader missing {asset}")
motion = (ROOT / "worthsy-motion.js").read_text(encoding="utf-8")
for feature in ("installCurtain", "enhanceMotion", "installCursor", "IntersectionObserver", "prefers-reduced-motion", ".wst-card", "#wst-grid > *", ".wst-btn"):
    if feature not in motion:
        errors.append(f"Motion runtime missing expected feature: {feature}")
css = (ROOT / "worthsy-motion.css").read_text(encoding="utf-8")
for feature in (".wsy-tilt-card", ".wsy-page-curtain", ".wsy-magnetic", ".wsy-reveal-clip", "prefers-reduced-motion"):
    if feature not in css:
        errors.append(f"Motion stylesheet missing expected feature: {feature}")
if errors:
    raise SystemExit("\\n".join(errors))
print(f"WORTHSY motion audit passed: {len(PAGES)} pages and shared motion assets verified.")
