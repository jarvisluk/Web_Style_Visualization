import { STYLE_LIST } from "../styles/index.js";
import { applyStyle, applyCustomVariables, getCurrentStyleId } from "../utils/css-var-manager.js";
import { t, getStyleName, getCategoryName, onLangChange } from "../utils/i18n.js";

export function renderStyleSelector(container) {
  let hasInitialScrolled = false;

  const render = () => {
    container.innerHTML = "";
    
    const title = document.createElement("div");
    title.className = "style-selector-title";
    title.textContent = t("selector.title");

    const grid = document.createElement("div");
    grid.className = "style-selector-grid";

    // Built-in style cards
    STYLE_LIST.forEach((style) => {
      const card = document.createElement("div");
      card.className = "style-card";
      card.dataset.styleId = style.id;

      card.innerHTML = `
        <div class="style-card-name">${getStyleName(style)}</div>
        <div class="style-card-category">${getCategoryName(style.category)}</div>
      `;

      card.addEventListener("click", () => {
        applyStyle(style.id);
        updateActiveState(grid, style.id);
      });

      grid.appendChild(card);
    });

    // Custom CSS card (last in list)
    const customCard = document.createElement("div");
    customCard.className = "style-card style-card-custom";
    customCard.dataset.styleId = "custom";
    customCard.innerHTML = `
      <div class="style-card-name">${t("custom.name")}</div>
      <div class="style-card-category">${getCategoryName("custom")}</div>
    `;
    customCard.addEventListener("click", () => {
      openCustomCSSModal(grid);
    });
    grid.appendChild(customCard);

    // Custom CSS modal
    const modal = createCustomCSSModal(grid);

    container.appendChild(title);
    container.appendChild(grid);
    container.appendChild(modal);

    const activeId = getCurrentStyleId();
    if (activeId) {
      updateActiveState(grid, activeId);
    } else if (STYLE_LIST.length > 0) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const defaultId = prefersDark ? "dark-mode" : "material";
      const defaultStyle = STYLE_LIST.find((s) => s.id === defaultId) || STYLE_LIST[0];
      applyStyle(defaultStyle.id);
      updateActiveState(grid, defaultStyle.id);
    }

    // Scroll initialization
    if (!hasInitialScrolled) {
      requestAnimationFrame(() => {
        const prefersDarkScroll = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const idToScroll = getCurrentStyleId() || (prefersDarkScroll ? "dark-mode" : "material");
        const activeCard = grid.querySelector(`.style-card[data-style-id="${idToScroll}"]`);
        if (activeCard) {
          const scrollLeft = activeCard.offsetLeft - (grid.clientWidth / 2) + (activeCard.offsetWidth / 2);
          grid.scrollTo({ left: scrollLeft, behavior: "instant" });
        }
        hasInitialScrolled = true;
      });
    }
  };

  render();
  onLangChange(render);
}

function createCustomCSSModal(grid) {
  const modal = document.createElement("div");
  modal.className = "custom-css-modal";
  modal.id = "custom-css-modal";
  modal.innerHTML = `
    <div class="custom-css-modal-backdrop"></div>
    <div class="custom-css-modal-content">
      <div class="custom-css-modal-header">
        <span class="custom-css-modal-title">${t("custom.title")}</span>
        <button class="custom-css-modal-close">×</button>
      </div>
      <div class="custom-css-modal-body">
        <p class="custom-css-modal-hint">${t("custom.hint")}</p>
        <textarea class="custom-css-textarea" placeholder=":root {\n  --color-primary: #6366f1;\n  --color-bg: #0f0f23;\n  --color-text: #e2e8f0;\n  --border-radius: 16px;\n  ...\n}" rows="10"></textarea>
        <div class="custom-css-file-row">
          <label class="btn btn-ghost btn-sm custom-css-file-label">
            ${t("custom.upload")}
            <input type="file" accept=".css,.txt" class="custom-css-file-input" />
          </label>
          <span class="custom-css-file-name"></span>
        </div>
      </div>
      <div class="custom-css-modal-footer">
        <button class="btn btn-ghost btn-sm custom-css-cancel">${t("custom.cancel")}</button>
        <button class="btn btn-primary btn-sm custom-css-apply">${t("custom.apply")}</button>
      </div>
    </div>
  `;

  // Close handlers
  modal.querySelector(".custom-css-modal-backdrop").addEventListener("click", () => closeModal(modal));
  modal.querySelector(".custom-css-modal-close").addEventListener("click", () => closeModal(modal));
  modal.querySelector(".custom-css-cancel").addEventListener("click", () => closeModal(modal));

  // File upload handler
  const fileInput = modal.querySelector(".custom-css-file-input");
  const fileNameEl = modal.querySelector(".custom-css-file-name");
  const textarea = modal.querySelector(".custom-css-textarea");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      textarea.value = ev.target.result;
    };
    reader.readAsText(file);
  });

  // Apply handler
  modal.querySelector(".custom-css-apply").addEventListener("click", () => {
    const cssText = textarea.value.trim();
    if (!cssText) return;

    const success = applyCustomVariables(cssText);
    if (success) {
      updateActiveState(grid, "custom");
      closeModal(modal);
    } else {
      alert("No CSS variables found. Please provide --variable: value; format.");
    }
  });

  return modal;
}

function openCustomCSSModal(grid) {
  const modal = document.getElementById("custom-css-modal");
  if (modal) {
    modal.classList.add("open");
  }
}

function closeModal(modal) {
  modal.classList.remove("open");
}

function updateActiveState(grid, activeId) {
  grid.querySelectorAll(".style-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.styleId === activeId);
  });
}
