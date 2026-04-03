import { STYLES, STYLE_LIST } from "../styles/index.js";
import {
  applyStyle as applyPresetStyle,
  applyValidatedVariables,
  getCurrentVariables,
  getCurrentStyle,
  getCurrentStyleId,
  resetToStyle,
} from "./css-var-manager.js";
import { generateCSS } from "./export.js";

const VARIABLE_DOCS = {
  "--color-primary": "Primary brand color (buttons, links, highlights)",
  "--color-primary-hover": "Hover state for primary color",
  "--color-bg": "Page background color",
  "--color-surface": "Card / panel surface color",
  "--color-text": "Primary text color",
  "--color-text-secondary": "Secondary / muted text color",
  "--color-accent": "Accent color for badges, alerts, highlights",
  "--color-border": "Default border color",
  "--border-radius": "Corner radius (e.g. 8px, 16px)",
  "--border-width": "Border thickness (e.g. 1px, 2px)",
  "--border-color": "Explicit border color override",
  "--shadow-x": "Box-shadow horizontal offset",
  "--shadow-y": "Box-shadow vertical offset",
  "--shadow-blur": "Box-shadow blur radius",
  "--shadow-spread": "Box-shadow spread radius",
  "--shadow-color": "Box-shadow color",
  "--font-family": "Font stack (e.g. 'Inter', sans-serif)",
  "--font-weight": "Normal font weight (100–900)",
  "--font-weight-bold": "Bold font weight (100–900)",
  "--font-size-base": "Base font size",
  "--font-size-sm": "Small font size",
  "--font-size-lg": "Large font size",
  "--font-size-xl": "Extra-large font size",
  "--font-size-xxl": "2x extra-large font size",
  "--line-height": "Line height multiplier",
  "--backdrop-blur": "Backdrop blur amount (e.g. 12px)",
  "--bg-opacity": "Background opacity (0–1)",
  "--glow-intensity": "Glow / neon intensity",
  "--glow-color": "Glow / neon color",
};

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error };
}

// ── Public API methods ──────────────────────────────────────────────

function listStyles() {
  try {
    const data = STYLE_LIST.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
    }));
    return ok(data);
  } catch (e) {
    return fail(e.message);
  }
}

function applyStyleById(styleId) {
  try {
    if (!styleId || typeof styleId !== "string") {
      return fail("styleId must be a non-empty string");
    }
    if (!STYLES[styleId]) {
      const available = Object.keys(STYLES).join(", ");
      return fail(`Unknown style "${styleId}". Available: ${available}`);
    }
    applyPresetStyle(styleId);
    return ok({ applied: styleId });
  } catch (e) {
    return fail(e.message);
  }
}

function applyVariables(variables) {
  try {
    if (!variables || typeof variables !== "object") {
      return fail("variables must be a non-null object");
    }
    const applied = applyValidatedVariables(variables);
    if (!applied) {
      return fail("No valid CSS variables found in the provided object");
    }
    return ok({ applied: true });
  } catch (e) {
    return fail(e.message);
  }
}

function getStyle() {
  try {
    const style = getCurrentStyle();
    if (!style) return ok(null);
    return ok({
      id: style.id,
      name: style.name,
      category: style.category,
      description: style.description,
      variables: style.variables,
    });
  } catch (e) {
    return fail(e.message);
  }
}

function getVariables() {
  try {
    return ok(getCurrentVariables());
  } catch (e) {
    return fail(e.message);
  }
}

function exportCSS() {
  try {
    return ok(generateCSS());
  } catch (e) {
    return fail(e.message);
  }
}

function reset() {
  try {
    resetToStyle();
    return ok({ reset: true, styleId: getCurrentStyleId() });
  } catch (e) {
    return fail(e.message);
  }
}

function getVariableDefinitions() {
  try {
    const defs = Object.entries(VARIABLE_DOCS).map(([name, description]) => ({
      name,
      description,
    }));
    return ok(defs);
  } catch (e) {
    return fail(e.message);
  }
}

// ── URL parameter support ───────────────────────────────────────────

function initFromURL() {
  const params = new URLSearchParams(window.location.search);

  const styleId = params.get("style");
  if (styleId) {
    applyStyleById(styleId);
    return;
  }

  const varsParam = params.get("variables");
  if (varsParam) {
    try {
      const variables = JSON.parse(varsParam);
      applyVariables(variables);
    } catch {
      console.warn("[WebStyleAPI] Failed to parse ?variables= JSON:", varsParam);
    }
  }
}

// ── PostMessage support ─────────────────────────────────────────────

const API_METHODS = {
  listStyles,
  applyStyle: applyStyleById,
  applyVariables,
  getCurrentStyle: getStyle,
  getCurrentVariables: getVariables,
  exportCSS,
  resetStyle: reset,
  getVariableDefinitions,
};

function handlePostMessage(event) {
  const msg = event.data;
  if (!msg || msg.type !== "WebStyleAPI") return;

  const { action, payload } = msg;
  const method = API_METHODS[action];
  if (!method) {
    event.source?.postMessage(
      { type: "WebStyleAPI:response", action, result: fail(`Unknown action "${action}"`) },
      event.origin === "null" ? "*" : event.origin
    );
    return;
  }

  const result = method(payload);
  event.source?.postMessage(
    { type: "WebStyleAPI:response", action, result },
    event.origin === "null" ? "*" : event.origin
  );
}

// ── Initialization ──────────────────────────────────────────────────

export function initAgentAPI() {
  window.WebStyleAPI = {
    listStyles,
    applyStyle: applyStyleById,
    applyVariables,
    getCurrentStyle: getStyle,
    getCurrentVariables: getVariables,
    exportCSS,
    resetStyle: reset,
    getVariableDefinitions,
  };

  window.addEventListener("message", handlePostMessage);

  initFromURL();
}
