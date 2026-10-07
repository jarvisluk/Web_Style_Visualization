// WebMCP: expose the style API as tools to in-browser AI agents.
// Spec: https://webmachinelearning.github.io/webmcp/
// The spec places the API on document.modelContext; early Chrome previews used
// navigator.modelContext, so both are detected. Without either, nothing happens
// and agents can still fall back to window.WebStyleAPI.

import { STYLE_LIST } from "../styles/index.js";
import { VARIABLES } from "./variables.js";

let status = { supported: false, tools: [], error: null };
let listeners = [];

export function getWebMCPStatus() {
  return status;
}

export function onWebMCPStatus(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function setStatus(next) {
  status = next;
  listeners.forEach((fn) => fn(status));
}

function getModelContext() {
  return document.modelContext || navigator.modelContext || null;
}

// MCP CallToolResult shape; structuredContent carries the raw data.
function toResult(result) {
  const payload = result.success ? result.data : { error: result.error };
  return {
    content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
    structuredContent: typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload : { result: payload },
    isError: !result.success,
  };
}

function variablesSchema() {
  const properties = {};
  for (const v of VARIABLES) {
    properties[v.name] = { type: "string", description: `${v.description} (${v.type})` };
  }
  return { type: "object", properties, additionalProperties: false };
}

export function buildTools(api) {
  const readOnly = { readOnlyHint: true };
  return [
    {
      name: "list_styles",
      title: "List preset styles",
      description: "List the built-in design style presets (id, name, category, description).",
      inputSchema: { type: "object", properties: {} },
      annotations: readOnly,
      execute: () => toResult(api.listStyles()),
    },
    {
      name: "get_current_style",
      title: "Get current style",
      description: "Get the active style, its resolved CSS variables, and any overrides applied on top of the preset.",
      inputSchema: { type: "object", properties: {} },
      annotations: readOnly,
      execute: () => toResult(api.getCurrentStyle()),
    },
    {
      name: "get_variable_definitions",
      title: "Get variable definitions",
      description: "List every CSS variable a style can set, with its value type (color, size, number, font) and meaning.",
      inputSchema: { type: "object", properties: {} },
      annotations: readOnly,
      execute: () => toResult(api.getVariableDefinitions()),
    },
    {
      name: "apply_style",
      title: "Apply preset style",
      description: "Switch the whole page to a preset style. Clears previous overrides.",
      inputSchema: {
        type: "object",
        properties: {
          styleId: { type: "string", enum: STYLE_LIST.map((s) => s.id), description: "Preset id from list_styles" },
        },
        required: ["styleId"],
      },
      execute: ({ styleId } = {}) => toResult(api.applyStyle(styleId)),
    },
    {
      name: "set_variables",
      title: "Set CSS variables",
      description:
        "Override CSS variables on top of the current style to create a custom look. " +
        "Only listed variables change. Colors: hex/rgb()/hsl()/oklch(); sizes need units (px, em, rem, %). " +
        "Invalid values are rejected and reported.",
      inputSchema: {
        type: "object",
        properties: { variables: variablesSchema() },
        required: ["variables"],
      },
      execute: ({ variables } = {}) => toResult(api.applyVariables(variables)),
    },
    {
      name: "reset_style",
      title: "Reset overrides",
      description: "Drop all overrides and restore the current preset's defaults.",
      inputSchema: { type: "object", properties: {} },
      execute: () => toResult(api.resetStyle()),
    },
    {
      name: "export_css",
      title: "Export CSS",
      description: "Export the current look as a :root { ... } CSS variables block ready to paste into a project.",
      inputSchema: { type: "object", properties: {} },
      annotations: readOnly,
      execute: () => toResult(api.exportCSS()),
    },
    {
      name: "get_share_url",
      title: "Get share URL",
      description: "Get a URL that reopens this page with the exact current style.",
      inputSchema: { type: "object", properties: {} },
      annotations: readOnly,
      execute: () => toResult(api.getShareURL()),
    },
  ];
}

export function initWebMCP(api) {
  const tools = buildTools(api);
  const names = tools.map((t) => t.name);
  const modelContext = getModelContext();

  if (!modelContext) {
    setStatus({ supported: false, tools: names, error: null });
    return status;
  }

  try {
    if (typeof modelContext.registerTool === "function") {
      const controller = new AbortController();
      window.addEventListener("pagehide", () => controller.abort(), { once: true });
      for (const tool of tools) {
        // Spec returns a Promise; early previews returned { unregister } synchronously.
        Promise.resolve(modelContext.registerTool(tool, { signal: controller.signal })).catch((e) =>
          console.warn(`[WebMCP] Failed to register ${tool.name}:`, e)
        );
      }
    } else if (typeof modelContext.provideContext === "function") {
      modelContext.provideContext({ tools });
    } else {
      throw new Error("modelContext has no registerTool/provideContext");
    }
    setStatus({ supported: true, tools: names, error: null });
  } catch (e) {
    console.warn("[WebMCP] Registration failed:", e);
    setStatus({ supported: false, tools: names, error: e.message });
  }
  return status;
}
