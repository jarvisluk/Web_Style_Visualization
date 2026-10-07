// The sample product page rendered inside the themed canvas.
// Everything here reads the style CSS variables; nothing reads --ui-* tokens.
import { getCurrentStyle, getCurrentStyleId, onChange } from "../utils/css-var-manager.js";
import { t, getLang, getStyleName, getStyleDesc, getCategoryName, onLangChange } from "../utils/i18n.js";
import { icon } from "../utils/icons.js";

const escapeHTML = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const SPARK = [32, 48, 40, 64, 52, 76, 60, 88, 72, 96];

function navHTML() {
  return `
    <nav class="d-nav">
      <div class="d-brand"><span class="d-brand-mark"></span>Lumen</div>
      <div class="d-nav-links">
        <a href="#">${t("demo.nav.product")}</a>
        <a href="#">${t("demo.nav.pricing")}</a>
        <a href="#">${t("demo.nav.docs")}</a>
      </div>
      <button class="btn btn-secondary btn-sm">${t("demo.nav.signin")}</button>
    </nav>`;
}

function heroHTML(style) {
  const name = style ? getStyleName(style) : "Web Style";
  const desc = style ? getStyleDesc(style) : "";
  const category = style ? getCategoryName(style.category) : "";
  return `
    <header class="d-hero">
      <span class="badge badge-accent">${t("demo.eyebrow")} · ${escapeHTML(category)}</span>
      <h1 class="d-hero-title">${escapeHTML(name)}</h1>
      <p class="d-hero-sub">${escapeHTML(desc)}</p>
      <div class="d-hero-actions">
        <button class="btn btn-primary btn-lg">${t("demo.start")} ${icon("arrowRight", 18)}</button>
        <button class="btn btn-secondary btn-lg">${t("demo.learn")}</button>
      </div>
    </header>`;
}

function statsHTML() {
  const stats = [
    { label: t("demo.stats.visitors"), value: "48.2k", delta: "+12.4%" },
    { label: t("demo.stats.conversion"), value: "3.9%", delta: "+0.6%" },
    { label: t("demo.stats.revenue"), value: "$126k", delta: "+8.1%" },
    { label: t("demo.stats.latency"), value: "84ms", delta: "−14ms" },
  ];
  return `
    <section class="tile d-stats">
      <div class="tile-head">
        <h3 class="tile-title">${t("demo.stats.title")}</h3>
        <span class="tile-meta">${t("demo.stats.period")}</span>
      </div>
      <div class="d-stats-grid">
        ${stats
          .map(
            (s) => `
          <div class="stat">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value">${s.value}</span>
            <span class="stat-delta">${icon("trendUp", 14)} ${s.delta}</span>
          </div>`
          )
          .join("")}
      </div>
      <div class="d-chart" aria-hidden="true">
        ${SPARK.map((h, i) => `<span style="height:${h}%" class="${i === SPARK.length - 1 ? "is-peak" : ""}"></span>`).join("")}
      </div>
    </section>`;
}

function keyPropsHTML(style) {
  const items = style?.keyProperties || [];
  return `
    <section class="tile d-key">
      <div class="tile-head"><h3 class="tile-title">${t("demo.key.title")}</h3></div>
      ${
        items.length
          ? `<ul class="d-key-list">${items
              .map(
                (k) => `<li><code>${escapeHTML(k.property)}</code><span>${escapeHTML(getLang() === "zh" && k.explanationZh ? k.explanationZh : k.explanation)}</span></li>`
              )
              .join("")}</ul>`
          : `<p class="muted">${t("demo.key.empty")}</p>`
      }
    </section>`;
}

function featureCardsHTML() {
  const cards = [
    { icon: "palette", title: t("cards.c1.title"), text: t("cards.c1.text") },
    { icon: "shapes", title: t("cards.c2.title"), text: t("cards.c2.text") },
    { icon: "sparkles", title: t("cards.c3.title"), text: t("cards.c3.text") },
  ];
  return cards
    .map(
      (c) => `
    <article class="tile card">
      <div class="card-icon">${icon(c.icon, 22)}</div>
      <h3 class="card-title">${c.title}</h3>
      <p class="card-text">${c.text}</p>
      <a class="card-link" href="#">${t("cards.learn")} ${icon("arrowRight", 14)}</a>
    </article>`
    )
    .join("");
}

function formHTML() {
  const roles = t("demo.form.roles").split("|");
  return `
    <form class="tile d-form">
      <div class="tile-head stacked">
        <h3 class="tile-title">${t("demo.form.title")}</h3>
        <p class="muted">${t("demo.form.desc")}</p>
      </div>
      <label class="field">
        <span class="field-label">${t("demo.form.email")}</span>
        <input class="input" type="email" placeholder="you@studio.com" />
      </label>
      <label class="field">
        <span class="field-label">${t("demo.form.role")}</span>
        <select class="input">${roles.map((r) => `<option>${r}</option>`).join("")}</select>
      </label>
      <label class="switch-row">
        <input type="checkbox" class="switch" checked />
        <span>${t("demo.form.updates")}</span>
      </label>
      <button type="button" class="btn btn-primary btn-block">${t("demo.form.submit")}</button>
    </form>`;
}

function componentsHTML() {
  return `
    <section class="tile d-ui">
      <div class="tile-head"><h3 class="tile-title">${t("demo.ui.title")}</h3></div>
      <div class="d-ui-row">
        <button class="btn btn-primary">${t("demo.ui.primary")}</button>
        <button class="btn btn-secondary">${t("demo.ui.secondary")}</button>
        <button class="btn btn-accent">${t("demo.ui.accent")}</button>
        <button class="btn btn-ghost">${t("demo.ui.ghost")}</button>
        <button class="btn btn-primary" disabled>${t("demo.ui.disabled")}</button>
      </div>
      <div class="d-ui-row">
        <span class="badge badge-primary">${t("demo.ui.new")}</span>
        <span class="badge badge-accent">${t("demo.ui.beta")}</span>
        <span class="badge badge-outline">${t("demo.ui.stable")}</span>
        <div class="avatars" aria-hidden="true"><span>A</span><span>K</span><span>M</span><span>+5</span></div>
      </div>
      <div class="progress-block">
        <div class="progress-label"><span>${t("demo.ui.progress")}</span><span>68%</span></div>
        <div class="progress"><span style="width:68%"></span></div>
      </div>
      <div class="alert">${icon("bell", 16)}<span>${t("demo.ui.alert")}</span></div>
    </section>`;
}

export function renderDemoPage(container) {
  let lastStyleId;

  const render = () => {
    const style = getCurrentStyle();
    lastStyleId = getCurrentStyleId();
    container.innerHTML = `
      <div class="d-ambient" aria-hidden="true"><span></span><span></span><span></span></div>
      ${navHTML()}
      ${heroHTML(style)}
      <div class="bento">
        ${statsHTML()}
        ${keyPropsHTML(style)}
        ${featureCardsHTML()}
        ${formHTML()}
        ${componentsHTML()}
      </div>
      <footer class="d-footer">© 2026 Lumen Inc. · <span class="muted">Rendered with CSS variables</span></footer>`;
  };

  // Demo links and forms are decorative.
  container.addEventListener("click", (e) => {
    if (e.target.closest("a[href='#']")) e.preventDefault();
  });
  container.addEventListener("submit", (e) => e.preventDefault());

  render();
  // Variable tweaks are pure CSS; only re-render when the style itself changes.
  onChange(() => {
    if (getCurrentStyleId() !== lastStyleId) render();
  });
  onLangChange(render);
}
