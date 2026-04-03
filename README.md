# <img src="./public/icon.svg" alt="icon" width="28" style="vertical-align: middle;"> Web Style Visualisation

[中文文档](./README_zh.md)

> An interactive style playground for designers and frontend developers: choose a design style, watch the entire site transform in real time, fine-tune every detail, and export the result as CSS.

**Live site:** https://jarvisluk.github.io/Web_Style_Visualization/

## Use with AI Agents (Cursor / Codex Skill)

This project includes an **Agent Skill** that lets AI coding assistants (like Cursor or Codex) generate and preview web styles on your behalf. Once the skill is installed, you can ask your AI assistant things like:

- *"Show me what a glassmorphism style looks like"*
- *"Create a dark futuristic theme with cyan accents"*
- *"Generate CSS for a warm, minimal design"*

The AI will either:
1. **Open the site in a browser**, apply the style, and take a screenshot for you to preview
2. **Give you a link** that opens the site with your style pre-applied
3. **Generate the CSS directly** in your chat for you to copy and use

### Installing the Skill

The skill file is located at `web-style-skill/SKILL.md` in this repository. To use it:

- **Cursor** — copy the `web-style-skill/` folder into your project or home directory where Cursor can discover skills
- **Codex** — place it under `~/.codex/skills/` so Codex automatically picks it up

Once installed, simply ask your AI assistant about web styles — it will know how to use the skill automatically.

---

## What Is This?

Web Style Visualisation lets you **see and feel** different web design styles — not just read about them. Pick a style, and the whole page instantly changes: buttons, cards, navigation, forms, stats, everything updates together so you can judge the style as a whole.

You can also tweak any parameter (colors, roundness, shadows, fonts, spacing…) with sliders and color pickers, then copy the CSS to use in your own projects.

## How to Use the Website

### 1. Choose a Style

At the top of the page you will find the **Style Selector** — a row of style cards. Click any card to apply that style to the entire site immediately.

Available styles:

| Style | What It Looks Like |
|---|---|
| **Flat Design** | Clean and minimal — no shadows, no gradients, pure flat color blocks |
| **Material Design** | Paper-like layers with subtle shadows that give a sense of depth |
| **Glassmorphism** | Frosted glass panels with background blur and transparency |
| **Neumorphism** | Soft, same-color raised and pressed surfaces — like clay or plastic |
| **Claymorphism** | Rounded, bubbly 3D blocks with a playful, tactile feel |
| **Brutalism** | Thick borders, hard shadows, raw typography — bold and loud |
| **Dark Mode** | Dark backgrounds with low glare, designed for comfortable night reading |
| **Retro / Pixel** | Pixelated fonts, neon colors, and an old-school arcade vibe |

### 2. Fine-Tune Parameters

After choosing a style, open the **Tuning Panel** to adjust details:

- **Colors** — change the primary color, background, text color, and accent color with color pickers
- **Roundness** — drag a slider to go from sharp corners to fully rounded
- **Shadows** — control shadow direction, blur, and intensity
- **Typography** — switch fonts and adjust weight
- **Spacing** — increase or decrease the breathing room between elements
- **Borders** — change border thickness

Some styles also have their own special controls. For example, Glassmorphism lets you adjust blur intensity and transparency; Brutalism lets you change the hard-shadow offset.

Every change is reflected **instantly** across all components on the page.

### 3. Export Your CSS

When you are happy with the result, open the **Code Panel**. It shows the full set of CSS variables that define the current look. You can:

- **Copy** the CSS to your clipboard with one click
- Paste it into your own project's stylesheet to apply the exact same style

### 4. Share via URL

Your current style is encoded in the page URL. Simply copy the URL from your browser's address bar and share it — anyone who opens it will see the exact same style configuration.

### 5. AI Chat (Experimental)

The site includes a built-in **AI assistant** (bottom of the page or floating button). You can describe a style in plain language — for example:

- *"Give me a cyberpunk look with neon purple and cyan on a dark background"*
- *"Minimalist Scandinavian design with soft pastels and lots of white space"*
- *"Warm coffee shop vibe with earthy browns and rounded corners"*

The AI will generate matching style parameters and apply them to the site. You can also click the **dice button** to get a random creative prompt for inspiration.

> Note: AI Chat requires an API key from a supported provider (OpenAI, Google Gemini, etc.). Click the settings gear icon in the chat panel to configure it.

## Available Styles at a Glance

### Classic Styles
- **Flat Design** — the OG minimal style, popular since iOS 7 and Windows Metro
- **Material Design** — Google's design language with elevation and layering

### Modern Styles
- **Glassmorphism** — the frosted glass trend popularized by Apple and modern dashboards
- **Neumorphism** — soft UI with extruded and inset shapes
- **Claymorphism** — the bubbly, 3D-cartoon aesthetic
- **Brutalism** — raw, unpolished, intentionally "ugly" design

### Themes
- **Dark Mode** — optimized for low-light environments
- **Retro / Pixel** — nostalgic arcade and 8-bit aesthetics

## Contributing

- **Add a new style** — submit a style JSON file following the template in `src/styles/_template.json`
- **Improve the site** — open an issue or pull request
- **Report bugs** — file an issue on GitHub

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This project is licensed under the [MIT License](./LICENSE).
