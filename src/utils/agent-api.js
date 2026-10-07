import { STYLES, STYLE_LIST } from "../styles/index.js";
import {
  applyStyle as applyPresetStyle,
  setVariables,
  getCurrentVariables,
  getCurrentStyle,
  getCurrentStyleId,
  getOverrides,
  resetToStyle,
} from "./css-var-manager.js";
import { generateCSS } from "./export.js";
import { VARIABLES, sanitizeVariables } from "./variables.js";
import { buildShareURL } from "./url-state.js";
import { initWebMCP } from "./webmcp.js";

function ok(data) {
  return { success: true, data };
}

function fail(error) {
  return { success: false, error };
}

function guard(fn) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (e) {
      return fail(e.message);
    }
  };
}

// ── Public API methods ──────────────────────────────────────────────
// Every method returns { success, data?, error? }. WebMCP tools wrap these.

export const api = {
  listStyles: guard(() =>
    ok(STYLE_LIST.map((s) => ({ id: s.id, name: s.name, category: s.category, description: s.description })))
  ),

  applyStyle: guard((styleId) => {
    if (!styleId || typeof styleId !== "string") return fail("styleId must be a non-empty string");
    if (!STYLES[styleId]) {
      return fail(`Unknown style "${styleId}". Available: ${Object.keys(STYLES).join(", ")}`);
    }
    applyPresetStyle(styleId);
    return ok({ applied: styleId, url: buildShareURL() });
  }),

  // Merges onto the current style; omitted variables keep their values.
  applyVariables: guard((variables) => {
    if (!variables || typeof variables !== "object") return fail("variables must be a non-null object");
    const { valid, errors } = sanitizeVariables(variables);
    if (Object.keys(valid).length === 0) {
      return fail(errors.length ? errors.join("; ") : "No variables provided");
    }
    if (!getCurrentStyleId()) applyPresetStyle("flat");
    setVariables(valid);
    return ok({ applied: Object.keys(valid), rejected: errors, url: buildShareURL() });
  }),

  getCurrentStyle: guard(() => {
    const style = getCurrentStyle();
    if (!style) return ok(null);
    return ok({
      id: style.id,
      name: style.name,
      category: style.category,
      description: style.description,
      variables: getCurrentVariables(),
      overrides: getOverrides(),
    });
  }),

  getCurrentVariables: guard(() => ok(getCurrentVariables())),

  exportCSS: guard(() => ok(generateCSS())),

  resetStyle: guard(() => {
    resetToStyle();
    return ok({ reset: true, styleId: getCurrentStyleId() });
  }),

  getVariableDefinitions: guard(() =>
    ok(VARIABLES.map(({ name, type, group, description }) => ({ name, type, group, description })))
  ),

  getShareURL: guard(() => ok(buildShareURL())),
};

// ── PostMessage support ─────────────────────────────────────────────

function handlePostMessage(event) {
  const msg = event.data;
  if (!msg || msg.type !== "WebStyleAPI") return;

  const { action, payload } = msg;
  const method = Object.hasOwn(api, action) ? api[action] : null;
  const result = method ? method(payload) : fail(`Unknown action "${action}"`);
  event.source?.postMessage(
    { type: "WebStyleAPI:response", action, result },
    event.origin === "null" ? "*" : event.origin
  );
}

// ── Initialization ──────────────────────────────────────────────────

export function initAgentAPI() {
  window.WebStyleAPI = { ...api };
  window.addEventListener("message", handlePostMessage);
  return initWebMCP(api);
}
