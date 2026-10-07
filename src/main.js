import "./style.css";

import { renderDemoPage } from "./components/demo-page.js";
import { renderStyleSelector } from "./panels/style-selector.js";
import { renderInspector } from "./panels/inspector.js";
import { renderTopbar, renderStageToolbar, initUITheme } from "./panels/chrome.js";

import { applyStyle } from "./utils/css-var-manager.js";
import { initFromURL, syncURLOnChange } from "./utils/url-state.js";
import { api, initAgentAPI } from "./utils/agent-api.js";

function init() {
  initUITheme();

  // Pick the starting style before anything renders.
  if (!initFromURL()) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyStyle(prefersDark ? "dark-mode" : "liquid-glass");
  }

  const frame = document.getElementById("canvas-frame");
  renderTopbar(document.getElementById("topbar"));
  renderStyleSelector(document.getElementById("style-rail"));
  renderStageToolbar(document.getElementById("stage-toolbar"), frame);
  renderDemoPage(document.getElementById("canvas"));
  renderInspector(document.getElementById("inspector"), api);

  document.getElementById("scrim").addEventListener("click", () => {
    document.body.classList.remove("inspector-open");
  });

  syncURLOnChange();
  initAgentAPI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
