import { STYLE_LIST } from "../styles/index.js";
import { applyStyle, applyCustomVariables, getCurrentStyleId, onChange } from "../utils/css-var-manager.js";
import { t, getStyleName, getStyleDesc, getCategoryName, onLangChange } from "../utils/i18n.js";
import { icon } from "../utils/icons.js";

const CATEGORY_ORDER = ["modern", "classic", "theme"];

// A miniature of the style, painted with its own variables.
function swatchHTML(style) {
  const v = style.variables;
  const radius = Math.min(parseFloat(v["--border-radius"]) || 0, 10);
  const border = parseFloat(v["--border-width"]) ? v["--border-color"] || v["--color-border"] : "transparent";
  return `
    <span class="swatch" style="background:${v["--color-bg"]}">
      <span class="swatch-card" style="background:${v["--color-surface"]};border-radius:${radius}px;border-color:${border}">
        <span class="swatch-line" style="background:${v["--color-text"]}"></span>
        <span class="swatch-pill" style="background:${v["--color-primary"]};border-radius:${radius}px"></span>
      </span>
      <span class="swatch-dot" style="background:${v["--color-accent"]}"></span>
    </span>`;
}

export function renderStyleSelector(container) {
  const modal = createCustomCSSModal();
  document.body.appendChild(modal);

  const render = () => {
    const groups = CATEGORY_ORDER.map((cat) => ({
      cat,
      styles: STYLE_LIST.filter((s) => s.category === cat),
    })).filter((g) => g.styles.length);

    container.innerHTML = `
      <div class="rail-head">
        <span class="rail-title">${t("rail.title")}</span>
        <span class="rail-count">${STYLE_LIST.length} ${t("rail.count")}</span>
      </div>
      <div class="rail-list" role="listbox" aria-label="${t("rail.title")}">
        ${groups
          .map(
            (g) => `
          <div class="rail-group" role="group" aria-label="${getCategoryName(g.cat)}">
            <div class="rail-group-label">${getCategoryName(g.cat)}</div>
            ${g.styles
              .map(
                (s) => `
              <button class="style-item" role="option" data-style-id="${s.id}" title="${getStyleDesc(s)}">
                ${swatchHTML(s)}
                <span class="style-item-text">
                  <span class="style-item-name">${getStyleName(s)}</span>
                  <span class="style-item-desc">${getStyleDesc(s)}</span>
                </span>
              </button>`
              )
              .join("")}
          </div>`
          )
          .join("")}
        <div class="rail-group">
          <button class="style-item style-item-custom" data-style-id="custom">
            <span class="swatch swatch-custom">${icon("plus", 18)}</span>
            <span class="style-item-text">
              <span class="style-item-name">${t("custom.name")}</span>
              <span class="style-item-desc">${t("custom.desc")}</span>
            </span>
          </button>
        </div>
      </div>`;

    container.querySelectorAll(".style-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.styleId;
        if (id === "custom") openModal(modal);
        else applyStyle(id);
      });
    });

    syncActive();
  };

  // Scroll only the rail itself. scrollIntoView would also scroll every ancestor,
  // including the page that embeds the studio in an iframe.
  const revealInRail = (item) => {
    let rail = item.parentElement;
    while (rail && rail !== document.body) {
      const { overflowX, overflowY } = getComputedStyle(rail);
      if (/(auto|scroll)/.test(overflowX + overflowY)) break;
      rail = rail.parentElement;
    }
    if (!rail || rail === document.body) return;
    const r = item.getBoundingClientRect();
    const c = rail.getBoundingClientRect();
    const top = r.top < c.top ? r.top - c.top : r.bottom > c.bottom ? r.bottom - c.bottom : 0;
    rail.scrollBy({ top, left: r.left + r.width / 2 - (c.left + c.width / 2) });
  };

  const syncActive = () => {
    const activeId = getCurrentStyleId();
    container.querySelectorAll(".style-item").forEach((item) => {
      const active = item.dataset.styleId === activeId;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      if (active && !item.dataset.seen) {
        item.dataset.seen = "1";
        revealInRail(item);
      }
    });
  };

  // In the narrow layout the list scrolls horizontally: let a vertical mouse
  // wheel drive it, and mark the edges so the fade only shows where more items are.
  const updateEdges = () => {
    const list = container.querySelector(".rail-list");
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    list.classList.toggle("can-scroll-left", max > 1 && list.scrollLeft > 1);
    list.classList.toggle("can-scroll-right", max > 1 && list.scrollLeft < max - 1);
  };

  container.addEventListener(
    "wheel",
    (e) => {
      const list = e.target.closest(".rail-list");
      if (!list || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = list.scrollWidth - list.clientWidth;
      if (max <= 1) return; // vertical layout: normal scrolling
      const atStart = list.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = list.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // let the page scroll past the ends
      e.preventDefault();
      list.scrollLeft += e.deltaY;
    },
    { passive: false }
  );
  container.addEventListener("scroll", updateEdges, true);
  window.addEventListener("resize", updateEdges);

  render();
  updateEdges();
  onChange(syncActive);
  onLangChange(() => {
    render();
    updateEdges();
    rebuildModal(modal);
  });
}

function createCustomCSSModal() {
  const modal = document.createElement("dialog");
  modal.className = "ui-modal";
  rebuildModal(modal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
  return modal;
}

function rebuildModal(modal) {
  modal.innerHTML = `
    <form method="dialog" class="ui-modal-card">
      <div class="ui-modal-head">
        <span class="ui-modal-title">${t("custom.title")}</span>
        <button class="ui-icon-btn" value="cancel" aria-label="${t("custom.cancel")}">${icon("x", 16)}</button>
      </div>
      <p class="ui-hint">${t("custom.hint")}</p>
      <textarea class="ui-textarea" rows="10" spellcheck="false" placeholder=":root {\n  --color-primary: #6366f1;\n  --color-bg: #0f0f23;\n  --border-radius: 16px;\n}"></textarea>
      <p class="ui-error" hidden></p>
      <div class="ui-modal-foot">
        <label class="ui-btn ui-btn-ghost">
          ${icon("download", 14)} ${t("custom.upload")}
          <input type="file" accept=".css,.txt" hidden />
        </label>
        <span class="ui-spacer"></span>
        <button class="ui-btn ui-btn-ghost" value="cancel">${t("custom.cancel")}</button>
        <button class="ui-btn ui-btn-primary" value="apply" type="button" data-apply>${t("custom.apply")}</button>
      </div>
    </form>`;

  const textarea = modal.querySelector("textarea");
  const error = modal.querySelector(".ui-error");

  modal.querySelector("input[type=file]").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      textarea.value = ev.target.result;
    };
    reader.readAsText(file);
  });

  modal.querySelector("[data-apply]").addEventListener("click", () => {
    const cssText = textarea.value.trim();
    if (!cssText) return;
    if (applyCustomVariables(cssText)) {
      error.hidden = true;
      modal.close();
    } else {
      error.textContent = t("custom.invalid");
      error.hidden = false;
    }
  });
}

function openModal(modal) {
  modal.showModal();
  modal.querySelector("textarea")?.focus();
}
