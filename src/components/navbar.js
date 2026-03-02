import { t, toggleLang, onLangChange } from "../utils/i18n.js";

export function renderNavbar(container) {
  const render = () => {
    container.innerHTML = `
      <div class="navbar-brand">
        <span>🎨</span>
        <span>Web Style Visualisation</span>
      </div>
      <button class="navbar-toggle" aria-label="Toggle navigation">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <ul class="navbar-links">
        <li><a href="#hero">${t("nav.preview")}</a></li>
        <li><a href="#cards">${t("nav.components")}</a></li>
        <li><a href="https://github.com/jarvisluk/Web_Style_Visualization" target="_blank" rel="noopener">${t("nav.github")}</a></li>
        <li><a href="#" class="lang-toggle" style="font-weight: bold; color: var(--color-primary);">${t("nav.lang")}</a></li>
      </ul>
    `;

    container.querySelector(".lang-toggle").addEventListener("click", (e) => {
      e.preventDefault();
      toggleLang();
    });

    const toggleBtn = container.querySelector(".navbar-toggle");
    const links = container.querySelector(".navbar-links");
    toggleBtn.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  };

  render();
  onLangChange(render);
}
