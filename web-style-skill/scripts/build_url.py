#!/usr/bin/env python3
"""One-stop helper for the Web Style Visualization agent workflow.

Self-contained — all preset data is embedded. No workspace files needed.

Covers the full Tier 2 / Tier 3 pipeline in a single invocation:
  1. Load a built-in preset style            (if "style" is given)
  2. Merge user-supplied CSS variable overrides (if "variables" is given)
  3. Generate a :root { … } CSS block          (Tier 3 offline CSS)
  4. Build a preview URL with encoded params   (Tier 2 URL)

Usage
-----
    python build_url.py '{"style": "glassmorphism"}'
    python build_url.py '{"variables": {"--color-primary": "#6366f1"}}'
    python build_url.py '{"style": "flat", "variables": {"--color-primary": "#6366f1"}}'
    echo '{"style": "retro"}' | python build_url.py
    python build_url.py -f config.json
    python build_url.py --url-only '{"style": "glassmorphism"}'

Input JSON
----------
    {
      "style":     "<preset-id>",          // optional — preset to load
      "variables": { "--var": "value" },   // optional — CSS variable overrides
      "base_url":  "https://..."           // optional — override site origin
    }

Output (default)
----------------
    {
      "url":        "https://…?style=…&variables=…",
      "css":        ":root { --color-primary: #a855f7; … }",
      "variables":  { "--color-primary": "#a855f7", … },
      "style_info": { "id": "…", "name": "…", "category": "…", "description": "…" }
    }
"""

from __future__ import annotations

import json
import sys
import urllib.parse

BASE_URL = "https://jarvisluk.github.io/Web_Style_Visualization/"

DEFAULT_BASE_STYLE = "flat"

# ---------------------------------------------------------------------------
# Embedded preset data (synced from src/styles/*.json)
# ---------------------------------------------------------------------------
PRESETS: dict[str, dict] = {
    "flat": {
        "name": "Flat Design",
        "category": "classic",
        "description": "Clean, minimal, no shadows, bold solid colors",
        "variables": {
            "--color-primary": "#2563eb",
            "--color-primary-hover": "#1d4ed8",
            "--color-bg": "#f8fafc",
            "--color-surface": "#ffffff",
            "--color-text": "#0f172a",
            "--color-text-secondary": "#64748b",
            "--color-accent": "#ef4444",
            "--color-border": "#e2e8f0",
            "--border-radius": "8px",
            "--border-width": "2px",
            "--border-color": "#e2e8f0",
            "--shadow-x": "0px",
            "--shadow-y": "0px",
            "--shadow-blur": "0px",
            "--shadow-spread": "0px",
            "--shadow-color": "transparent",
            "--font-family": "'Inter', 'Noto Sans SC', sans-serif",
            "--font-weight": "400",
            "--font-weight-bold": "700",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "material": {
        "name": "Material Design",
        "category": "classic",
        "description": "Google's design system with elevation-based depth and structured layout",
        "variables": {
            "--color-primary": "#6750a4",
            "--color-primary-hover": "#5639a0",
            "--color-bg": "#fffbfe",
            "--color-surface": "#f7f2fa",
            "--color-text": "#1c1b1f",
            "--color-text-secondary": "#49454f",
            "--color-accent": "#b3261e",
            "--color-border": "#cac4d0",
            "--border-radius": "12px",
            "--border-width": "0px",
            "--border-color": "transparent",
            "--shadow-x": "0px",
            "--shadow-y": "2px",
            "--shadow-blur": "6px",
            "--shadow-spread": "0px",
            "--shadow-color": "rgba(0, 0, 0, 0.14)",
            "--font-family": "'Roboto', 'Noto Sans SC', sans-serif",
            "--font-weight": "400",
            "--font-weight-bold": "500",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "glassmorphism": {
        "name": "Glassmorphism",
        "category": "modern",
        "description": "Frosted glass effect with blur and transparency",
        "variables": {
            "--color-primary": "#a855f7",
            "--color-primary-hover": "#9333ea",
            "--color-bg": "#0f172a",
            "--color-surface": "rgba(255, 255, 255, 0.05)",
            "--color-text": "#f8fafc",
            "--color-text-secondary": "#cbd5e1",
            "--color-accent": "#ec4899",
            "--color-border": "rgba(255, 255, 255, 0.1)",
            "--border-radius": "24px",
            "--border-width": "1px",
            "--border-color": "rgba(255, 255, 255, 0.2)",
            "--shadow-x": "0px",
            "--shadow-y": "16px",
            "--shadow-blur": "32px",
            "--shadow-spread": "0px",
            "--shadow-color": "rgba(31, 38, 135, 0.15)",
            "--font-family": "'Inter', 'Noto Sans SC', sans-serif",
            "--font-weight": "400",
            "--font-weight-bold": "600",
            "--backdrop-blur": "12px",
            "--bg-opacity": "0.1",
        },
    },
    "neumorphism": {
        "name": "Neumorphism",
        "category": "modern",
        "description": "Soft UI with extruded and inset elements using dual-tone shadows",
        "variables": {
            "--color-primary": "#3b82f6",
            "--color-primary-hover": "#2563eb",
            "--color-bg": "#f0f3f8",
            "--color-surface": "#f0f3f8",
            "--color-text": "#1e293b",
            "--color-text-secondary": "#64748b",
            "--color-accent": "#f43f5e",
            "--color-border": "transparent",
            "--border-radius": "20px",
            "--border-width": "0px",
            "--border-color": "transparent",
            "--shadow-x": "8px",
            "--shadow-y": "8px",
            "--shadow-blur": "16px",
            "--shadow-spread": "0px",
            "--shadow-color": "#d1d9e6",
            "--font-family": "'Inter', 'Noto Sans SC', sans-serif",
            "--font-weight": "400",
            "--font-weight-bold": "700",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "claymorphism": {
        "name": "Claymorphism",
        "category": "modern",
        "description": "Soft 3D clay-like elements with rounded shapes and inner shadows",
        "variables": {
            "--color-primary": "#6366f1",
            "--color-primary-hover": "#4f46e5",
            "--color-bg": "#f1f5f9",
            "--color-surface": "#ffffff",
            "--color-text": "#334155",
            "--color-text-secondary": "#64748b",
            "--color-accent": "#f43f5e",
            "--color-border": "transparent",
            "--border-radius": "32px",
            "--border-width": "0px",
            "--border-color": "transparent",
            "--shadow-x": "10px",
            "--shadow-y": "10px",
            "--shadow-blur": "20px",
            "--shadow-spread": "0px",
            "--shadow-color": "rgba(0, 0, 0, 0.2)",
            "--font-family": "'Inter', 'Noto Sans SC', sans-serif",
            "--font-weight": "500",
            "--font-weight-bold": "700",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "brutalism": {
        "name": "Brutalism",
        "category": "modern",
        "description": "Raw, bold, high contrast with hard shadows and thick borders",
        "variables": {
            "--color-primary": "#ff90e8",
            "--color-primary-hover": "#e078cb",
            "--color-bg": "#f4f4f0",
            "--color-surface": "#ffffff",
            "--color-text": "#000000",
            "--color-text-secondary": "#1a1a1a",
            "--color-accent": "#ffe500",
            "--color-border": "#000000",
            "--border-radius": "0px",
            "--border-width": "3px",
            "--border-color": "#000000",
            "--shadow-x": "8px",
            "--shadow-y": "8px",
            "--shadow-blur": "0px",
            "--shadow-spread": "0px",
            "--shadow-color": "#000000",
            "--font-family": "'Courier Prime', 'Noto Serif SC', monospace",
            "--font-weight": "400",
            "--font-weight-bold": "700",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "dark-mode": {
        "name": "Dark Mode",
        "category": "theme",
        "description": "Dark background with reduced brightness and focused content",
        "variables": {
            "--color-primary": "#a855f7",
            "--color-primary-hover": "#c084fc",
            "--color-bg": "#09090b",
            "--color-surface": "#18181b",
            "--color-text": "#fafafa",
            "--color-text-secondary": "#a1a1aa",
            "--color-accent": "#2dd4bf",
            "--color-border": "#27272a",
            "--border-radius": "16px",
            "--border-width": "1px",
            "--border-color": "#27272a",
            "--shadow-x": "0px",
            "--shadow-y": "8px",
            "--shadow-blur": "24px",
            "--shadow-spread": "0px",
            "--shadow-color": "rgba(0, 0, 0, 0.5)",
            "--font-family": "'Inter', 'Noto Sans SC', sans-serif",
            "--font-weight": "400",
            "--font-weight-bold": "600",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
        },
    },
    "retro": {
        "name": "Retro / Pixel",
        "category": "theme",
        "description": "Pixel art aesthetic with neon accents and retro typography",
        "variables": {
            "--color-primary": "#ff0080",
            "--color-primary-hover": "#cc0066",
            "--color-bg": "#0a0a1a",
            "--color-surface": "#12122b",
            "--color-text": "#00f0ff",
            "--color-text-secondary": "#a0a0c0",
            "--color-accent": "#fcee0a",
            "--color-border": "#ff0080",
            "--border-radius": "0px",
            "--border-width": "2px",
            "--border-color": "#ff0080",
            "--shadow-x": "0px",
            "--shadow-y": "0px",
            "--shadow-blur": "16px",
            "--shadow-spread": "0px",
            "--shadow-color": "rgba(255, 0, 128, 0.5)",
            "--font-family": "'Press Start 2P', 'ZCOOL QingKe HuangYou', 'Courier Prime', monospace",
            "--font-weight": "400",
            "--font-weight-bold": "400",
            "--font-size-base": "12px",
            "--font-size-sm": "10px",
            "--font-size-lg": "16px",
            "--font-size-xl": "20px",
            "--font-size-xxl": "28px",
            "--line-height": "2.2",
            "--backdrop-blur": "0px",
            "--bg-opacity": "1",
            "--glow-intensity": "1",
            "--glow-color": "#ff0080",
        },
    },
}

VALID_STYLES = list(PRESETS.keys())


def build_url(config: dict) -> str:
    """Build a preview URL from config (Tier 2)."""
    base = config.get("base_url", BASE_URL).rstrip("/") + "/"
    style = config.get("style")
    variables = config.get("variables")

    if not style and not variables:
        return base

    params: dict[str, str] = {}
    if style:
        if style not in PRESETS:
            raise ValueError(
                f"Unknown style '{style}'. Valid: {', '.join(VALID_STYLES)}"
            )
        params["style"] = style
    if variables:
        if not isinstance(variables, dict):
            raise TypeError("'variables' must be a JSON object")
        params["variables"] = json.dumps(variables, separators=(",", ":"))

    return base + "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)


def build_css(variables: dict) -> str:
    """Format a variables dict into a :root { … } CSS block (Tier 3)."""
    lines = [f"  {k}: {v};" for k, v in variables.items()]
    return ":root {\n" + "\n".join(lines) + "\n}"


def process(config: dict) -> dict:
    """Full pipeline: load preset → merge variables → return url + css + meta."""
    style_id = config.get("style")
    user_vars = config.get("variables") or {}

    preset: dict | None = None
    base_vars: dict = {}

    if style_id:
        if style_id not in PRESETS:
            raise ValueError(
                f"Unknown style '{style_id}'. Valid: {', '.join(VALID_STYLES)}"
            )
        preset = PRESETS[style_id]
        base_vars = dict(preset["variables"])
    elif user_vars:
        preset = PRESETS[DEFAULT_BASE_STYLE]
        base_vars = dict(preset["variables"])

    merged = {**base_vars, **user_vars}
    url = build_url(config)
    css = build_css(merged) if merged else ""

    style_info = None
    if preset:
        info_id = style_id or DEFAULT_BASE_STYLE
        style_info = {
            "id": info_id,
            "name": preset["name"],
            "category": preset["category"],
            "description": preset["description"],
        }

    return {
        "url": url,
        "css": css,
        "variables": merged,
        "style_info": style_info,
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Build a Web Style Visualization preview URL + CSS from JSON.",
    )
    parser.add_argument(
        "json_input", nargs="?", default=None,
        help='JSON string, e.g. \'{"style": "glassmorphism"}\'',
    )
    parser.add_argument(
        "--file", "-f", default=None,
        help="Read JSON from a file instead of argument / stdin",
    )
    parser.add_argument(
        "--url-only", action="store_true",
        help="Only print the URL (skip CSS generation and preset loading)",
    )
    args = parser.parse_args()

    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            raw = fh.read()
    elif args.json_input:
        raw = args.json_input
    elif not sys.stdin.isatty():
        raw = sys.stdin.read()
    else:
        parser.error("Provide JSON as an argument, via --file, or pipe to stdin")
        return

    try:
        config = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"Error: invalid JSON — {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        if args.url_only:
            print(build_url(config))
        else:
            result = process(config)
            print(json.dumps(result, indent=2, ensure_ascii=False))
    except (ValueError, TypeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
