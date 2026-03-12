import "./style.css";

// Components
import { renderNavbar } from "./components/navbar.js";
import { renderHero } from "./components/hero.js";
import { renderCards } from "./components/cards.js";
import { renderButtons } from "./components/buttons.js";
import { renderStats } from "./components/stats.js";

// Panels
import { renderStyleSelector } from "./panels/style-selector.js";
import { renderTuningPanel } from "./panels/tuning-panel.js";
import { renderCodePanel } from "./panels/code-panel.js";

function init() {
  // Render all components
  renderNavbar(document.getElementById("navbar"));
  renderStyleSelector(document.getElementById("style-selector"));
  renderHero(document.getElementById("hero"));
  renderCards(document.getElementById("cards"));
  renderButtons(document.getElementById("buttons"));
  renderStats(document.getElementById("stats"));

  // Render panels
  renderTuningPanel(document.getElementById("tuning-panel"));
  renderCodePanel(document.getElementById("code-panel"));

  // Toggle buttons
  const tuningToggle = document.getElementById("tuning-toggle");
  const tuningPanel = document.getElementById("tuning-panel");
  // Default open on desktop, collapsed on mobile
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile) {
    tuningPanel.classList.add("open");
    document.body.classList.add("tuning-open");
  }
  tuningToggle.addEventListener("click", () => {
    tuningPanel.classList.toggle("open");
    document.body.classList.toggle("tuning-open");
  });
}

// Boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
