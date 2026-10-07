// Single source of truth for the CSS variables a style can set.
// Used by the CSS variable manager, window.WebStyleAPI and the WebMCP tools.

export const VARIABLES = [
  { name: "--color-primary", type: "color", group: "color", description: "Primary brand color (buttons, links, highlights)" },
  { name: "--color-primary-hover", type: "color", group: "color", description: "Hover state for primary color" },
  { name: "--color-bg", type: "color", group: "color", description: "Page background color" },
  { name: "--color-surface", type: "color", group: "color", description: "Card / panel surface color" },
  { name: "--color-text", type: "color", group: "color", description: "Primary text color" },
  { name: "--color-text-secondary", type: "color", group: "color", description: "Secondary / muted text color" },
  { name: "--color-accent", type: "color", group: "color", description: "Accent color for badges, alerts, highlights" },
  { name: "--color-border", type: "color", group: "color", description: "Default border color" },
  { name: "--border-radius", type: "size", group: "shape", description: "Corner radius (e.g. 8px, 16px)" },
  { name: "--border-width", type: "size", group: "shape", description: "Border thickness (e.g. 1px, 2px)" },
  { name: "--border-color", type: "color", group: "shape", description: "Explicit border color override" },
  { name: "--shadow-x", type: "size", group: "shadow", description: "Box-shadow horizontal offset" },
  { name: "--shadow-y", type: "size", group: "shadow", description: "Box-shadow vertical offset" },
  { name: "--shadow-blur", type: "size", group: "shadow", description: "Box-shadow blur radius" },
  { name: "--shadow-spread", type: "size", group: "shadow", description: "Box-shadow spread radius" },
  { name: "--shadow-color", type: "color", group: "shadow", description: "Box-shadow color" },
  { name: "--font-family", type: "font", group: "typography", description: "Font stack (e.g. 'Inter', sans-serif)" },
  { name: "--font-weight", type: "number", group: "typography", description: "Normal font weight (100–900)" },
  { name: "--font-weight-bold", type: "number", group: "typography", description: "Bold font weight (100–900)" },
  { name: "--font-size-base", type: "size", group: "typography", description: "Base font size" },
  { name: "--font-size-sm", type: "size", group: "typography", description: "Small font size" },
  { name: "--font-size-lg", type: "size", group: "typography", description: "Large font size" },
  { name: "--font-size-xl", type: "size", group: "typography", description: "Extra-large font size" },
  { name: "--font-size-xxl", type: "size", group: "typography", description: "2x extra-large font size" },
  { name: "--line-height", type: "number", group: "typography", description: "Line height multiplier" },
  { name: "--backdrop-blur", type: "size", group: "effect", description: "Backdrop blur amount (e.g. 12px)" },
  { name: "--bg-opacity", type: "number", group: "effect", description: "Surface opacity (0–1); below 1 reveals the ambient backdrop" },
  { name: "--glow-intensity", type: "number", group: "effect", description: "Glow / neon intensity (0–1)" },
  { name: "--glow-color", type: "color", group: "effect", description: "Glow / neon color" },
];

export const VARIABLE_NAMES = VARIABLES.map((v) => v.name);

const BY_NAME = new Map(VARIABLES.map((v) => [v.name, v]));

const VALIDATORS = {
  color: (v) =>
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ||
    /^(rgb|hsl|oklch|oklab|lab|lch)a?\([^;{}<>]*\)$/i.test(v) ||
    /^(transparent|currentcolor|[a-z]+)$/i.test(v),
  size: (v) => /^-?\d+(\.\d+)?(px|em|rem|%)$/.test(v) || v === "0",
  number: (v) => /^-?\d+(\.\d+)?$/.test(v),
  font: (v) => v.length <= 300 && !/[;{}<>\\]/.test(v),
};

/** Returns null when valid, otherwise a human-readable reason. */
export function checkVariable(name, value) {
  const def = BY_NAME.get(name);
  if (!def) return `Unknown variable "${name}"`;
  if (typeof value !== "string" && typeof value !== "number") return `${name}: value must be a string`;
  const str = String(value).trim();
  if (!str || !VALIDATORS[def.type](str)) return `${name}: invalid ${def.type} value "${str}"`;
  return null;
}

/** Splits an object of variables into accepted values and per-key errors. */
export function sanitizeVariables(input) {
  const valid = {};
  const errors = [];
  for (const [name, value] of Object.entries(input || {})) {
    const err = checkVariable(name, value);
    if (err) errors.push(err);
    else valid[name] = String(value).trim();
  }
  return { valid, errors };
}
