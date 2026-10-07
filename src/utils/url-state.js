import { STYLES } from "../styles/index.js";
import { applyStyle, setVariables, getCurrentStyleId, getCurrentVariables, getOverrides, onChange } from "./css-var-manager.js";
import { sanitizeVariables } from "./variables.js";

export const DEFAULT_BASE_STYLE = "flat";

/** Shareable URL for the current state: ?style=<id>&variables=<overrides JSON>. */
export function buildShareURL() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  const styleId = getCurrentStyleId();
  if (styleId && styleId !== "custom") {
    url.searchParams.set("style", styleId);
    const overrides = getOverrides();
    if (Object.keys(overrides).length) url.searchParams.set("variables", JSON.stringify(overrides));
  } else if (styleId === "custom") {
    url.searchParams.set("variables", JSON.stringify(getCurrentVariables()));
  }
  return url.toString();
}

/**
 * Apply ?style= and/or ?variables= from the current URL.
 * Variables without a style are merged onto the flat preset (same as build_url.py).
 * Returns true when the URL described a style.
 */
export function initFromURL() {
  const params = new URLSearchParams(window.location.search);
  const styleId = params.get("style");
  const varsParam = params.get("variables");
  if (!styleId && !varsParam) return false;

  applyStyle(styleId && STYLES[styleId] ? styleId : DEFAULT_BASE_STYLE);
  if (varsParam) {
    try {
      const { valid, errors } = sanitizeVariables(JSON.parse(varsParam));
      if (errors.length) console.warn("[WebStyleAPI] Ignored URL variables:", errors);
      if (Object.keys(valid).length) setVariables(valid);
    } catch {
      console.warn("[WebStyleAPI] Failed to parse ?variables= JSON:", varsParam);
    }
  }
  return true;
}

/** Keep the address bar in sync so copying it shares the exact look. */
export function syncURLOnChange() {
  let timer = null;
  onChange(() => {
    clearTimeout(timer);
    timer = setTimeout(() => history.replaceState(null, "", buildShareURL() + window.location.hash), 250);
  });
}
