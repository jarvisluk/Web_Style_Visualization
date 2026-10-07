import { getCurrentStyle, getOverrides, resetToStyle, onChange } from "../utils/css-var-manager.js";
import { t, getStyleName, getCategoryName, onLangChange } from "../utils/i18n.js";
import { getWebMCPStatus, onWebMCPStatus, buildTools } from "../utils/webmcp.js";
import { icon } from "../utils/icons.js";
import { renderTuningPanel } from "./tuning-panel.js";
import { renderCodePanel } from "./code-panel.js";

const TABS = [
  { id: "tune", icon: "sliders", label: "inspector.tune" },
  { id: "code", icon: "code", label: "inspector.code" },
  { id: "agent", icon: "bot", label: "inspector.agent" },
];

function readTab() {
  try {
    return localStorage.getItem("inspector_tab") || "tune";
  } catch {
    return "tune";
  }
}

export function renderInspector(container, api) {
  let activeTab = readTab();

  container.innerHTML = `
    <div class="ins-head"></div>
    <div class="ins-tabs" role="tablist"></div>
    <div class="ins-body">
      <div class="ins-pane" data-pane="tune" role="tabpanel"></div>
      <div class="ins-pane" data-pane="code" role="tabpanel"></div>
      <div class="ins-pane" data-pane="agent" role="tabpanel"></div>
    </div>`;

  const head = container.querySelector(".ins-head");
  const tabs = container.querySelector(".ins-tabs");

  const renderHead = () => {
    const style = getCurrentStyle();
    const modified = Object.keys(getOverrides()).length;
    head.innerHTML = `
      <div class="ins-style">
        <span class="ins-style-name">${style ? getStyleName(style) : "—"}</span>
        <span class="ins-style-meta">
          <span class="ui-chip">${style ? getCategoryName(style.category) : ""}</span>
          ${modified ? `<span class="ui-chip ui-chip-accent">${modified} ${t("inspector.modified")}</span>` : ""}
        </span>
      </div>
      <button class="ui-btn ui-btn-ghost ui-btn-sm" data-reset ${modified ? "" : "disabled"}>${icon("rotate", 14)}<span>${t("inspector.reset")}</span></button>`;
    head.querySelector("[data-reset]").addEventListener("click", resetToStyle);
  };

  const renderTabs = () => {
    tabs.innerHTML = TABS.map(
      (tab) => `
      <button class="ins-tab" role="tab" data-tab="${tab.id}" aria-selected="${tab.id === activeTab}">
        ${icon(tab.icon, 15)}<span>${t(tab.label)}</span>
      </button>`
    ).join("");
    tabs.querySelectorAll(".ins-tab").forEach((btn) =>
      btn.addEventListener("click", () => selectTab(btn.dataset.tab))
    );
    container.querySelectorAll(".ins-pane").forEach((pane) => {
      pane.hidden = pane.dataset.pane !== activeTab;
    });
  };

  const selectTab = (id) => {
    activeTab = id;
    try {
      localStorage.setItem("inspector_tab", id);
    } catch {
      // Remembering the tab is a convenience only.
    }
    renderTabs();
  };

  renderHead();
  renderTabs();
  renderTuningPanel(container.querySelector('[data-pane="tune"]'));
  renderCodePanel(container.querySelector('[data-pane="code"]'));
  renderAgentPane(container.querySelector('[data-pane="agent"]'), api);

  onChange(renderHead);
  onLangChange(() => {
    renderHead();
    renderTabs();
  });
}

function renderAgentPane(container, api) {
  const tools = buildTools(api);

  const render = () => {
    const status = getWebMCPStatus();
    container.innerHTML = `
      <div class="agent-status ${status.supported ? "is-on" : ""}">
        <span class="agent-dot"></span>
        <div>
          <div class="agent-status-title">${status.supported ? t("agent.status.on") : t("agent.status.off")}</div>
          <p class="ui-hint">${status.supported ? t("agent.status.onDesc") : t("agent.status.offDesc")}</p>
        </div>
      </div>

      <div class="ins-section-title">${t("agent.tools")} <span class="ui-chip">${tools.length}</span></div>
      <ul class="tool-list">
        ${tools
          .map(
            (tool) => `
          <li>
            <code class="tool-name">${tool.name}</code>
            ${tool.annotations?.readOnlyHint ? `<span class="ui-chip">read-only</span>` : ""}
            <p>${tool.description}</p>
          </li>`
          )
          .join("")}
      </ul>

      <div class="ins-section-title">${t("agent.other")}</div>
      <div class="agent-way">
        <div class="agent-way-title">${t("agent.console")}</div>
        <pre class="code-block code-block-sm"><code>window.WebStyleAPI.applyStyle("liquid-glass")
window.WebStyleAPI.applyVariables({ "--color-primary": "#ff375f" })
window.WebStyleAPI.exportCSS()</code></pre>
      </div>
      <div class="agent-way">
        <div class="agent-way-title">${t("agent.url")}</div>
        <pre class="code-block code-block-sm"><code>?style=editorial&amp;variables={"--color-accent":"#2563eb"}</code></pre>
      </div>
      <div class="agent-way">
        <div class="agent-way-title">${t("agent.skill")}</div>
        <p class="ui-hint">${t("agent.skillDesc")}</p>
      </div>`;
  };

  render();
  onWebMCPStatus(render);
  onLangChange(render);
}
