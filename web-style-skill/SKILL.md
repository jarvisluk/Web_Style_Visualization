---
name: web-style-api
description: >-
  Control the Web Style Visualization website programmatically via
  window.WebStyleAPI. Use when generating, previewing, or adjusting
  web design styles through browser automation (Playwright, Puppeteer,
  browser-use). Covers available CSS variables, preset styles, and
  export workflows.
---

# Web Style API — Agent Skill

**Site URL:** https://jarvisluk.github.io/Web_Style_Visualization/

Use this skill when a task requires previewing, generating, or adjusting web
design styles on the **Web Style Visualization** site. The agent must first
navigate to the URL above, then use the global `window.WebStyleAPI` object
via browser DevTools, Playwright `page.evaluate()`, or `postMessage`.

## Quick Start

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

## Playwright / browser-use Examples

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

## URL Parameter Usage

Open the site with query parameters to apply styles on load:

```
# Apply a preset
https://jarvisluk.github.io/Web_Style_Visualization/?style=glassmorphism

# Apply custom variables (URL-encoded JSON)
https://jarvisluk.github.io/Web_Style_Visualization/?variables=%7B%22--color-primary%22%3A%22%236366f1%22%7D
```

Only one of `?style=` or `?variables=` is used; `?style=` takes priority.

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

1. Navigate to **https://jarvisluk.github.io/Web_Style_Visualization/**
2. Call `listStyles()` to see available presets.
3. Call `applyStyle(id)` to start from a preset, or `applyVariables({...})` for a fully custom look.
4. Take a screenshot to verify the visual result.
5. Call `exportCSS()` to get the final CSS output.
6. Optionally call `resetStyle()` and iterate.
