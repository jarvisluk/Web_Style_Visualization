#!/usr/bin/env python3
"""Subset the Chinese pixel font used by the Retro / Pixel style.

The full Fusion Pixel 12px (zh-Hans) font is ~650 KB. The site only ever shows
fixed UI strings, so we keep just the Chinese characters that appear in the
source and ship a tiny woff2. Re-run after changing Chinese copy:

    npm run subset:pixel -- --source path/to/fusion-pixel-12px-monospaced-zh_hans.otf.woff2

Source font (SIL OFL 1.1, no Reserved Font Name):
    https://github.com/TakWolf/fusion-pixel-font/releases
    asset: fusion-pixel-font-12px-monospaced-otf.woff2-v<version>.zip
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "fonts" / "fusion-pixel" / "fusion-pixel-12px-sc-subset.woff2"

# Files whose Chinese text can appear on the page.
SOURCES = [
    *sorted((ROOT / "src" / "styles").glob("*.json")),
    *sorted((ROOT / "src").rglob("*.js")),
]

# Must match the unicode-range of the @font-face in src/style.css.
CJK = re.compile(r"[　-〿㐀-䶿一-鿿＀-￯—…‘’“”]")

# Always include common punctuation so new copy rarely needs a re-run for it.
EXTRA = "，。、：；！？（）《》「」『』【】—…“”‘’　"


def collect_chars() -> str:
    chars = set(EXTRA)
    for path in SOURCES:
        chars.update(CJK.findall(path.read_text(encoding="utf-8")))
    return "".join(sorted(chars))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="Fusion Pixel 12px monospaced zh_hans .otf/.woff2")
    args = parser.parse_args()

    text = collect_chars()
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True

    font = subset.load_font(args.source, options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(font, str(OUTPUT), options)
    print(f"{len(text)} characters -> {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
