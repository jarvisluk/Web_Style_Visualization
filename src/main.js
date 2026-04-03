import "./style.css";

// Components
import { renderNavbar } from "./components/navbar.js";
import { renderHero } from "./components/hero.js";
import { renderCards } from "./components/cards.js";
import { renderButtons } from "./components/buttons.js";
import { renderStats } from "./components/stats.js";

// Panels
import { renderAIChat } from "./panels/ai-chat.js";
import { renderStyleSelector } from "./panels/style-selector.js";
import { renderTuningPanel } from "./panels/tuning-panel.js";
import { renderCodePanel } from "./panels/code-panel.js";

// Agent API
import { initAgentAPI } from "./utils/agent-api.js";

function init() {
  // Render all components
  renderNavbar(document.getElementById("navbar"));
  renderAIChat(document.getElementById("ai-chat"));
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
  // Default behaviour: open on desktop, closed on mobile
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
  if (isDesktop) {
    document.body.classList.add("tuning-open");
    tuningPanel.classList.add("open");
  } else {
    document.body.classList.remove("tuning-open");
    tuningPanel.classList.remove("open");
  }

  tuningToggle.addEventListener("click", () => {
    tuningPanel.classList.toggle("open");
    document.body.classList.toggle("tuning-open");
  });

  initAgentAPI();
}

// Boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
