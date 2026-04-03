---
name: web-style-api
description: >-
  Control the Web Style Visualization website programmatically via
  window.WebStyleAPI, URL parameters, or the built-in helper script.
  Use when generating, previewing, or adjusting web design styles.
  Supports browser automation, URL-based preview, and fully offline
  CSS generation. Self-contained — no workspace files required.
---

# Web Style API — Agent Skill

**Site URL:** https://jarvisluk.github.io/Web_Style_Visualization/

> **CRITICAL — DO NOT modify any local project files.**
> When the user asks you to create / adjust / preview a web style, use the
> tiered approach below. Never edit local source code, CSS files, or JSON
> style files to fulfil a style request.

## Capability Tiers (choose the best available)

Pick the **highest tier** your environment supports:

| Tier | Method | Requires | Capabilities |
|---|---|---|---|
| 1 | Playwright / browser-use | Headless browser | Full API + screenshots + live preview |
| 2 | URL parameters | User opens link | Apply preset or custom vars in browser |
| 3 | Offline CSS generation | Python 3 | Run `build_url.py` to get CSS from built-in presets |

### Tier 1 — Browser Automation (Playwright / browser-use)

Use when a headless browser is available. Provides the richest experience:
interactive preview, screenshots, and full `window.WebStyleAPI` access.

### Tier 2 — URL Parameters (no automation needed)

Construct a URL and tell the user to open it. No Playwright required.

```
# Preset
https://jarvisluk.github.io/Web_Style_Visualization/?style=glassmorphism

# Custom variables (URL-encoded JSON)
https://jarvisluk.github.io/Web_Style_Visualization/?variables=%7B%22--color-primary%22%3A%22%236366f1%22%7D
```

#### Helper Script (`web-style-skill/scripts/build_url.py`)

A one-stop Python script that covers the full Tier 2 / Tier 3 pipeline:
load preset → merge overrides → generate CSS → build URL.
No external dependencies — Python 3 standard library only.

**Input JSON schema:**

```json
{
  "style":     "<preset-id>",         // optional — load a built-in preset
  "variables": { "--var": "val" },    // optional — CSS variable overrides
  "base_url":  "https://..."          // optional — override site URL
}
```

**Default output** is a JSON object containing everything the agent needs:

```json
{
  "url":        "https://…?style=…&variables=…",
  "css":        ":root { --color-primary: …; … }",
  "variables":  { "--color-primary": "…", "…": "…" },
  "style_info": { "id": "…", "name": "…", "category": "…", "description": "…" }
}
```

- When only `style` is given → loads preset variables, URL uses `?style=<id>`.
- When only `variables` is given → merges onto `flat` as the default base.
- When both are given → loads the preset, overlays overrides, URL includes both params.

**Usage:**

```bash
# Preset — returns full JSON (url + css + variables + style_info)
python web-style-skill/scripts/build_url.py '{"style": "glassmorphism"}'

# Custom overrides (auto-merges onto flat base)
python web-style-skill/scripts/build_url.py '{"variables": {"--color-primary": "#6366f1"}}'

# Preset + overrides
python web-style-skill/scripts/build_url.py '{"style": "brutalism", "variables": {"--color-primary": "#ff0000"}}'

# URL-only mode (just prints the URL string)
python web-style-skill/scripts/build_url.py --url-only '{"style": "retro"}'

# From stdin / file
echo '{"style": "dark-mode"}' | python web-style-skill/scripts/build_url.py
python web-style-skill/scripts/build_url.py -f config.json
```

**Programmatic import:**

```python
from build_url import build_url, process

# URL only
url = build_url({"style": "glassmorphism"})

# Full pipeline (url + css + variables + style_info)
result = process({
    "style": "glassmorphism",
    "variables": {"--color-primary": "#6366f1"}
})
print(result["css"])
```

### Tier 3 — Offline CSS Generation (no browser at all)

The helper script has all preset data built in. Simply run it and read the
`css` field from the output — no workspace files needed:

```bash
python web-style-skill/scripts/build_url.py '{"style": "glassmorphism"}'
# → output JSON includes "css": ":root { --color-primary: #a855f7; … }"
```

The script automatically loads the built-in preset, merges any user overrides,
and formats the result as `:root { … }` CSS. When only `variables` is
provided (no `style`), it uses `flat` as the default base.

## Quick Start (Tier 1)

```js
// 1. List available preset styles
window.WebStyleAPI.listStyles();

// 2. Apply a preset
window.WebStyleAPI.applyStyle("glassmorphism");

// 3. Apply custom variables
window.WebStyleAPI.applyVariables({
  "--color-primary": "#6366f1",
  "--color-bg": "#0f172a",
  "--border-radius": "16px"
});

// 4. Export the result as CSS
window.WebStyleAPI.exportCSS();
```

## API Reference

Every method returns `{ success: boolean, data?: any, error?: string }`.

| Method | Argument | Description |
|---|---|---|
| `listStyles()` | — | Returns array of `{ id, name, category, description }` for all presets |
| `applyStyle(styleId)` | `string` | Apply a preset style by id (e.g. `"flat"`, `"glassmorphism"`) |
| `applyVariables(vars)` | `object` | Apply a CSS variables object `{ "--var": "value" }` |
| `getCurrentStyle()` | — | Current style info: `{ id, name, category, description, variables }` |
| `getCurrentVariables()` | — | Current resolved CSS variable values as an object |
| `exportCSS()` | — | Export current state as a `:root { ... }` CSS string |
| `resetStyle()` | — | Reset overrides back to the current preset defaults |
| `getVariableDefinitions()` | — | All supported variable names with descriptions |

## Available Preset Style IDs

- `flat` — Flat Design (classic)
- `material` — Material Design (classic)
- `glassmorphism` — Glassmorphism (modern)
- `neumorphism` — Neumorphism (modern)
- `claymorphism` — Claymorphism (modern)
- `brutalism` — Brutalism (modern)
- `dark-mode` — Dark Mode (theme)
- `retro` — Retro (theme)

## Supported CSS Variables

### Colors
| Variable | Description |
|---|---|
| `--color-primary` | Primary brand color (buttons, links, highlights) |
| `--color-primary-hover` | Hover state for primary color |
| `--color-bg` | Page background color |
| `--color-surface` | Card / panel surface color |
| `--color-text` | Primary text color |
| `--color-text-secondary` | Secondary / muted text color |
| `--color-accent` | Accent color for badges, alerts |
| `--color-border` | Default border color |

### Borders & Radius
| Variable | Description |
|---|---|
| `--border-radius` | Corner radius (e.g. `8px`, `16px`) |
| `--border-width` | Border thickness (e.g. `1px`, `2px`) |
| `--border-color` | Explicit border color override |

### Shadows
| Variable | Description |
|---|---|
| `--shadow-x` | Box-shadow horizontal offset |
| `--shadow-y` | Box-shadow vertical offset |
| `--shadow-blur` | Box-shadow blur radius |
| `--shadow-spread` | Box-shadow spread radius |
| `--shadow-color` | Box-shadow color |

### Typography
| Variable | Description |
|---|---|
| `--font-family` | Font stack |
| `--font-weight` | Normal font weight (100–900) |
| `--font-weight-bold` | Bold font weight (100–900) |
| `--font-size-base` | Base font size |
| `--font-size-sm` | Small font size |
| `--font-size-lg` | Large font size |
| `--font-size-xl` | Extra-large font size |
| `--font-size-xxl` | 2x extra-large font size |
| `--line-height` | Line height multiplier |

### Effects
| Variable | Description |
|---|---|
| `--backdrop-blur` | Backdrop blur amount (e.g. `12px`) |
| `--bg-opacity` | Background opacity (0–1) |
| `--glow-intensity` | Glow / neon intensity |
| `--glow-color` | Glow / neon color |

## Tier 1 Examples (Playwright / browser-use)

### Navigate to the site and apply a preset

```js
await page.goto("https://jarvisluk.github.io/Web_Style_Visualization/");
const result = await page.evaluate(() => {
  window.WebStyleAPI.applyStyle("glassmorphism");
  return window.WebStyleAPI.exportCSS();
});
console.log(result.data); // :root { --color-primary: ... }
```

### Apply custom variables

```js
await page.goto("https://jarvisluk.github.io/Web_Style_Visualization/");
await page.evaluate(() => {
  window.WebStyleAPI.applyVariables({
    "--color-primary": "#6366f1",
    "--color-bg": "#0f172a",
    "--color-surface": "#1e293b",
    "--color-text": "#f8fafc",
    "--border-radius": "16px",
    "--backdrop-blur": "12px"
  });
});
```

### Discover all variables

```js
const defs = await page.evaluate(() =>
  window.WebStyleAPI.getVariableDefinitions()
);
// defs.data → [{ name: "--color-primary", description: "..." }, ...]
```

## PostMessage Usage (iframe embedding)

Send a message to the site's window to invoke any API method:

```js
const iframe = document.querySelector("iframe");
iframe.contentWindow.postMessage({
  type: "WebStyleAPI",
  action: "applyVariables",
  payload: { "--color-primary": "#6366f1" }
}, "*");

window.addEventListener("message", (event) => {
  if (event.data?.type === "WebStyleAPI:response") {
    console.log(event.data.action, event.data.result);
  }
});
```

Supported `action` values match the API method names: `listStyles`,
`applyStyle`, `applyVariables`, `getCurrentStyle`, `getCurrentVariables`,
`exportCSS`, `resetStyle`, `getVariableDefinitions`.

## Typical Agent Workflow

> Remember: **DO NOT** create or edit any local project files. Everything
> happens via the API, URL parameters, or the built-in helper script.

**If browser automation is available (Tier 1):**

1. Open **https://jarvisluk.github.io/Web_Style_Visualization/** in the browser.
2. Call `listStyles()` to see available presets.
3. Call `applyStyle(id)` or `applyVariables({...})` for a custom look.
4. Take a screenshot to verify the visual result.
5. Tell the user to visit the URL, or call `exportCSS()` to return CSS.

**If no browser automation (Tier 2 / Tier 3):**

1. Run the helper script with the user's requirements as JSON:
   ```bash
   python web-style-skill/scripts/build_url.py '{"style": "glassmorphism", "variables": {"--color-primary": "#6366f1"}}'
   ```
2. Parse the JSON output — it contains `url`, `css`, `variables`, and `style_info`.
3. Return the `css` block and the preview `url` to the user.
