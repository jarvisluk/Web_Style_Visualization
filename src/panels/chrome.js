// Studio chrome: top bar and stage toolbar. Styled only with --ui-* tokens.
import { t, toggleLang, onLangChange } from "../utils/i18n.js";
import { copyToClipboard } from "../utils/export.js";
import { buildShareURL } from "../utils/url-state.js";
import { icon } from "../utils/icons.js";

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference is still applied for this session.
  }
}

function currentUITheme() {
  const stored = document.documentElement.dataset.uiTheme;
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initUITheme() {
  const stored = storageGet("ui_theme");
  if (stored === "light" || stored === "dark") document.documentElement.dataset.uiTheme = stored;
}

export function renderTopbar(container) {
  const render = () => {
    const theme = currentUITheme();
    container.innerHTML = `
      <a class="brand" href="./" aria-label="Web Style Visualisation">
        <img src="${import.meta.env.BASE_URL}icon.svg" width="22" height="22" alt="" />
        <span class="brand-name">Web Style Visualisation</span>
        <span class="brand-tag">${t("app.tagline")}</span>
      </a>
      <div class="topbar-actions">
        <button class="ui-btn ui-btn-ghost" data-share>${icon("link", 15)}<span class="hide-sm">${t("top.share")}</span></button>
        <button class="ui-icon-btn" data-lang aria-label="Language">${icon("languages", 16)}<span class="lang-label">${t("top.lang")}</span></button>
        <button class="ui-icon-btn" data-theme aria-label="${t("top.theme")}">${icon(theme === "dark" ? "sun" : "moon", 16)}</button>
        <a class="ui-icon-btn" href="https://github.com/jarvisluk/Web_Style_Visualization" target="_blank" rel="noopener" aria-label="GitHub">${icon("github", 16)}</a>
        <button class="ui-icon-btn show-md" data-inspector aria-label="${t("top.inspector")}">${icon("sliders", 16)}</button>
      </div>`;

    const shareBtn = container.querySelector("[data-share]");
    shareBtn.addEventListener("click", async () => {
      if (!(await copyToClipboard(buildShareURL()))) return;
      shareBtn.innerHTML = `${icon("check", 15)}<span class="hide-sm">${t("top.shared")}</span>`;
      setTimeout(render, 1600);
    });
    container.querySelector("[data-lang]").addEventListener("click", toggleLang);
    container.querySelector("[data-theme]").addEventListener("click", () => {
      const next = currentUITheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.uiTheme = next;
      storageSet("ui_theme", next);
      render();
    });
    container.querySelector("[data-inspector]").addEventListener("click", () => {
      document.body.classList.toggle("inspector-open");
    });
  };

  render();
  onLangChange(render);
}

const VIEWPORTS = [
  { id: "desktop", icon: "monitor", label: "stage.desktop" },
  { id: "tablet", icon: "tablet", label: "stage.tablet" },
  { id: "mobile", icon: "phone", label: "stage.mobile" },
];

export function renderStageToolbar(container, frame) {
  let viewport = storageGet("viewport") || "desktop";

  const render = () => {
    frame.dataset.viewport = viewport;
    container.innerHTML = `
      <div class="segmented" role="radiogroup" aria-label="Viewport">
        ${VIEWPORTS.map(
          (v) => `
          <button role="radio" aria-checked="${v.id === viewport}" data-vp="${v.id}" title="${t(v.label)}">
            ${icon(v.icon, 15)}<span class="hide-sm">${t(v.label)}</span>
          </button>`
        ).join("")}
      </div>
      <div class="stage-url" aria-hidden="true"><span class="stage-url-dot"></span>lumen.app</div>`;

    container.querySelectorAll("[data-vp]").forEach((btn) =>
      btn.addEventListener("click", () => {
        viewport = btn.dataset.vp;
        storageSet("viewport", viewport);
        render();
      })
    );
  };

  render();
  onLangChange(render);
}
