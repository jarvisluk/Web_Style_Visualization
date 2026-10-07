# <img src="./public/icon.svg" alt="icon" width="28" style="vertical-align: middle;"> Web Style Visualisation

[中文文档](./README_zh.md)

> A design-style studio for designers and frontend developers: pick a style, watch a full sample page transform in real time, fine-tune every detail, and export the result as CSS. Built to be driven by people and AI agents alike.

**Live site:** https://jarvisluk.github.io/Web_Style_Visualization/

## What Is This?

Web Style Visualisation lets you **see and feel** web design styles instead of just reading about them. The studio has three columns:

- **Styles** (left) — every preset, each with a thumbnail painted in its own colors.
- **Canvas** (center) — a complete sample product page (nav, hero, dashboard, feature cards, form, components) that re-themes as a whole. Switch between desktop, tablet and mobile widths.
- **Inspector** (right) — Tune, Code and Agent tabs.

The studio's own interface uses a separate neutral palette (light and dark), so it stays readable whatever you are previewing.

## How to Use

### 1. Choose a Style

Click any style in the left column.

| Style | What It Looks Like |
|---|---|
| **Liquid Glass** | Bright, refractive glass layers over vivid color, with pill shapes |
| **Editorial** | Warm paper, ink typography, hairline rules and oversized serif headlines |
| **Glassmorphism** | Frosted glass panels with background blur |
| **Neumorphism** | Soft, same-color raised and pressed surfaces |
| **Claymorphism** | Rounded, bubbly 3D blocks with a playful feel |
| **Brutalism** | Thick borders, hard shadows, raw typography |
| **Flat Design** | Clean and minimal — no shadows, no gradients |
| **Material Design** | Material 3 tonal color and elevation |
| **Dark Mode** | Dark backgrounds with low glare |
| **Retro / Pixel** | Pixel fonts, neon glow, arcade vibe |

Or pick **Custom** to paste or upload your own CSS variables.

### 2. Fine-Tune

The **Tune** tab adjusts colors, radius, borders, shadows, typography and spacing. The current style's signature controls (Liquid Glass refraction blur, Retro neon glow, …) are listed first. Every change shows up on the canvas instantly.

### 3. Export CSS

The **Code** tab shows the full set of CSS variables for the current look. Copy it or download it as `variables.css`.

### 4. Share via URL

The address bar follows your edits (`?style=…&variables=…`). Copy it, or press **Copy link** in the top bar — anyone who opens it sees the exact same look.

## Use with AI Agents

There are four ways in; an agent picks whichever its environment supports.

### WebMCP (in-browser agents)

The site registers eight tools through [WebMCP](https://webmachinelearning.github.io/webmcp/): `list_styles`, `get_current_style`, `get_variable_definitions`, `apply_style`, `set_variables`, `reset_style`, `export_css` and `get_share_url`. In browsers that expose `document.modelContext`, an in-browser agent can call them directly with no scripting. The **Agent** tab shows whether your browser supports it.

### `window.WebStyleAPI` (browser automation)

Playwright, browser-use and similar tools can call the page's JS API:

```js
WebStyleAPI.applyStyle("liquid-glass");
WebStyleAPI.applyVariables({ "--color-primary": "#ff375f" }); // merged onto the current style
WebStyleAPI.exportCSS();
```

### URL parameters

```
?style=editorial
?style=editorial&variables={"--color-accent":"#2563eb"}
```

`variables` without `style` is merged onto `flat`.

### Agent Skill (coding assistants)

`web-style-skill/` is an Agent Skill that lets Claude Code, Codex, Cursor and other coding assistants generate styles, hand you preview links, or produce CSS fully offline:

- **Claude Code** — copy it to `~/.claude/skills/`
- **Codex** — copy it to `~/.codex/skills/`
- **Cursor** — copy it into your project or a directory where Cursor discovers skills

## Contributing

- **Add a new style** — create a style JSON from `src/styles/_template.json`, run `npm run validate`, then `npm run sync:skill` to copy the presets into the skill's offline script
- **Changed Chinese copy?** — run `npm run subset:pixel -- --source <font>` to regenerate the Retro style's Chinese pixel font subset ([Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font), SIL OFL 1.1; the script header explains where to get the source font)
- **Improve the site** — open an issue or pull request
- **Report bugs** — file an issue on GitHub

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This project is licensed under the [MIT License](./LICENSE).
