import { STYLES } from "../styles/index.js";
import { VARIABLE_NAMES, sanitizeVariables } from "./variables.js";

// Variables the tuning panel may set that are not part of a style definition.
const EXTRA_VARIABLES = ["--spacing"];

let currentStyleId = null;
let customStyle = null;
let overrides = {};
let listeners = [];

export function getCurrentStyleId() {
  return currentStyleId;
}

export function getCurrentStyle() {
  if (currentStyleId === "custom" && customStyle) return customStyle;
  return currentStyleId ? STYLES[currentStyleId] : null;
}

export function getOverrides() {
  return { ...overrides };
}

function paint(variables) {
  const root = document.documentElement;
  [...VARIABLE_NAMES, ...EXTRA_VARIABLES].forEach((name) => root.style.removeProperty(name));
  Object.entries(variables).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.style = currentStyleId || "";
}

export function applyStyle(styleId) {
  const style = STYLES[styleId];
  if (!style) return false;
  currentStyleId = styleId;
  overrides = {};
  paint(style.variables);
  notifyListeners();
  return true;
}

export function setVariable(name, value) {
  document.documentElement.style.setProperty(name, value);
  overrides[name] = value;
  notifyListeners();
}

/** Merge several overrides onto the current style in one update. */
export function setVariables(variables) {
  Object.entries(variables).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
    overrides[name] = value;
  });
  notifyListeners();
}

export function resetToStyle() {
  if (currentStyleId === "custom" && customStyle) {
    overrides = {};
    paint(customStyle.variables);
    notifyListeners();
  } else if (currentStyleId) {
    applyStyle(currentStyleId);
  }
}

export function getCurrentVariables() {
  const style = getCurrentStyle();
  if (!style) return { ...overrides };
  return { ...style.variables, ...overrides };
}

export function getComputedVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Apply custom CSS variables from raw CSS text.
 * Parses :root { --var: value; } blocks or plain --var: value; lines.
 */
export function applyCustomVariables(cssText) {
  const parsed = {};
  const regex = /(--[\w-]+)\s*:\s*([^;}]+)/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    parsed[match[1].trim()] = match[2].trim();
  }
  const { valid } = sanitizeVariables(parsed);
  if (Object.keys(valid).length === 0) return false;

  customStyle = {
    id: "custom",
    name: "Custom",
    nameZh: "自定义",
    category: "custom",
    description: "User-provided custom CSS variables",
    descriptionZh: "用户提供的自定义 CSS 变量",
    author: "user",
    variables: valid,
    specialTuning: [],
    keyProperties: [],
  };
  currentStyleId = "custom";
  overrides = {};
  paint(valid);
  notifyListeners();
  return true;
}

export function onChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(currentStyleId, overrides));
}
