import { getCurrentVariables } from "./css-var-manager.js";
import { getLang } from "./i18n.js";

export const PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelsEndpoint: true,
    keyPrefix: "sk-",
    browserCors: true,
  },
  opencode_zen: {
    id: "opencode_zen",
    name: "OpenCode Zen",
    baseUrl: "https://opencode.ai/zen/v1",
    defaultModel: "minimax-m2.5-free",
    modelsEndpoint: true,
    keyPrefix: "",
    browserCors: false,
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI Compatible)",
    baseUrl: "",
    defaultModel: "gpt-4o-mini",
    modelsEndpoint: false,
    keyPrefix: "",
    browserCors: false,
  },
};

let currentProviderId = localStorage.getItem("ai_provider") || "openai";
let customBaseUrl = localStorage.getItem("ai_custom_base_url") || "";
let corsProxyUrl = localStorage.getItem("ai_cors_proxy") || "";
let apiKey = null;
let rememberKey = false;
let providerChangeListeners = [];

function modelStorageKey(providerId) {
  return `ai_model_${providerId}`;
}

function storageKeyFor(providerId) {
  return `ai_api_key_${providerId}`;
}

export function getProvider() {
  return PROVIDERS[currentProviderId] || PROVIDERS.openai;
}

export function getProviderId() {
  return currentProviderId;
}

export function setProvider(providerId) {
  if (!PROVIDERS[providerId]) return;
  currentProviderId = providerId;
  localStorage.setItem("ai_provider", providerId);
  apiKey = null;
  rememberKey = false;
  const stored = localStorage.getItem(storageKeyFor(providerId));
  if (stored) {
    apiKey = stored;
    rememberKey = true;
  }
  providerChangeListeners.forEach(fn => fn(providerId));
}

export function getCustomBaseUrl() {
  return customBaseUrl;
}

export function setCustomBaseUrl(url) {
  customBaseUrl = url;
  localStorage.setItem("ai_custom_base_url", url);
}

export function getModel() {
  return localStorage.getItem(modelStorageKey(currentProviderId)) || "";
}

export function setModel(model) {
  if (model) {
    localStorage.setItem(modelStorageKey(currentProviderId), model);
  } else {
    localStorage.removeItem(modelStorageKey(currentProviderId));
  }
}

export function getCustomModel() {
  return getModel() || localStorage.getItem("ai_custom_model") || "";
}

export function setCustomModel(model) {
  setModel(model);
  localStorage.setItem("ai_custom_model", model);
}

export function getCorsProxy() {
  return corsProxyUrl;
}

export function setCorsProxy(url) {
  corsProxyUrl = url;
  localStorage.setItem("ai_cors_proxy", url);
}

export function needsCorsProxy() {
  const provider = getProvider();
  return !provider.browserCors;
}

export function onProviderChange(fn) {
  providerChangeListeners.push(fn);
  return () => {
    providerChangeListeners = providerChangeListeners.filter(l => l !== fn);
  };
}

function getActiveBaseUrl() {
  if (currentProviderId === "custom") {
    return customBaseUrl.replace(/\/+$/, "");
  }
  return getProvider().baseUrl;
}

function applyProxy(url) {
  if (!needsCorsProxy()) return url;

  if (import.meta.env?.DEV) {
    return `/__cors/${encodeURIComponent(url)}`;
  }

  if (!corsProxyUrl) return url;
  const proxy = corsProxyUrl.replace(/\/+$/, "");
  try {
    const proxyHost = new URL(proxy).hostname;
    if (proxyHost === "corsproxy.io" || proxyHost.endsWith(".corsproxy.io")) {
      return `${proxy}/?url=${encodeURIComponent(url)}`;
    }
  } catch {}
  return `${proxy}/${url}`;
}

function getActiveModel() {
  const stored = localStorage.getItem(modelStorageKey(currentProviderId));
  if (stored) return stored;
  if (currentProviderId === "custom") {
    const legacy = localStorage.getItem("ai_custom_model");
    if (legacy) return legacy;
  }
  return getProvider().defaultModel;
}

export function setApiKey(key, remember = false) {
  apiKey = key || null;
  rememberKey = remember;
  if (remember && key) {
    localStorage.setItem(storageKeyFor(currentProviderId), key);
  } else {
    localStorage.removeItem(storageKeyFor(currentProviderId));
  }
}

export function getApiKey() {
  if (apiKey) return apiKey;
  const stored = localStorage.getItem(storageKeyFor(currentProviderId));
  if (stored) {
    apiKey = stored;
    rememberKey = true;
  }
  return apiKey;
}

export function clearApiKey() {
  apiKey = null;
  rememberKey = false;
  localStorage.removeItem(storageKeyFor(currentProviderId));
}

export async function validateApiKey(key) {
  const baseUrl = getActiveBaseUrl();
  if (!baseUrl) return { valid: false, error: "NO_BASE_URL" };

  try {
    const response = await fetch(applyProxy(`${baseUrl}/models`), {
      method: "GET",
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (response.ok) return { valid: true };
    if (response.status === 401) return { valid: false, error: "API_KEY_INVALID" };
    if (response.status === 429) return { valid: false, error: "RATE_LIMITED" };
    return { valid: false, error: `API_ERROR_${response.status}` };
  } catch {
    return { valid: false, error: "NETWORK_ERROR" };
  }
}

const VARIABLE_DOCS = `
Available CSS variables (ONLY these are allowed):

Colors:
  --color-primary: Main brand/accent color (hex or rgb)
  --color-primary-hover: Hover state of primary color
  --color-bg: Page background color
  --color-surface: Card/component background color
  --color-text: Primary text color
  --color-text-secondary: Secondary/muted text color
  --color-accent: Accent/highlight color
  --color-border: Default border color

Shape:
  --border-radius: Corner radius (e.g. "8px", "24px")
  --border-width: Border thickness (e.g. "1px", "2px")
  --border-color: Border color

Shadow:
  --shadow-x: Horizontal shadow offset (e.g. "0px", "4px")
  --shadow-y: Vertical shadow offset (e.g. "2px", "8px")
  --shadow-blur: Shadow blur radius (e.g. "8px", "32px")
  --shadow-spread: Shadow spread (e.g. "0px", "2px")
  --shadow-color: Shadow color (e.g. "rgba(0,0,0,0.1)")

Typography:
  --font-family: Font stack (e.g. "'Inter', sans-serif")
  --font-weight: Normal text weight (e.g. "400")
  --font-weight-bold: Bold text weight (e.g. "700")

Special effects:
  --backdrop-blur: Backdrop blur amount (e.g. "0px", "12px")
  --bg-opacity: Background opacity 0-1 (e.g. "1", "0.1")
  --glow-intensity: Glow effect intensity 0-1 (e.g. "0")
  --glow-color: Glow color (e.g. "transparent", "#a855f7")
`.trim();

function buildSystemPrompt() {
  const lang = getLang();
  const langInstruction = lang === "zh"
    ? "Respond in Chinese. The explanation field should be in Chinese."
    : "Respond in English. The explanation field should be in English.";

  return `You are a web design style expert. The user will describe a website style they want, and you generate CSS custom properties (variables) that achieve that look.

${VARIABLE_DOCS}

Rules:
1. ONLY output variables from the list above. Never invent new variable names.
2. Respond with a JSON object containing exactly two fields:
   - "explanation": A brief (1-3 sentence) description of the style you created
   - "variables": An object mapping CSS variable names to their values
3. Every value must be a valid CSS value for that property type.
4. For colors, use hex (#rrggbb) or rgba() format.
5. For sizes, always include units (px, em, etc.).
6. For font-family, use quoted font names in a stack.
7. You don't need to include all variables — only include the ones relevant to the user's request. Omitted variables keep their current values.
8. Do NOT include any markdown formatting, code fences, or extra text. Output ONLY the JSON object.

${langInstruction}`;
}

function buildUserMessage(userText) {
  const currentVars = getCurrentVariables();
  const currentContext = Object.keys(currentVars).length > 0
    ? "\n\nCurrent active CSS variables:\n" + Object.entries(currentVars)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n")
    : "";

  return userText + currentContext;
}

const ALLOWED_VARIABLES = new Set([
  "--color-primary", "--color-primary-hover", "--color-bg", "--color-surface",
  "--color-text", "--color-text-secondary", "--color-accent", "--color-border",
  "--border-radius", "--border-width", "--border-color",
  "--shadow-x", "--shadow-y", "--shadow-blur", "--shadow-spread", "--shadow-color",
  "--font-family", "--font-weight", "--font-weight-bold",
  "--backdrop-blur", "--bg-opacity", "--glow-intensity", "--glow-color"
]);

const COLOR_VARS = new Set([
  "--color-primary", "--color-primary-hover", "--color-bg", "--color-surface",
  "--color-text", "--color-text-secondary", "--color-accent", "--color-border",
  "--border-color", "--shadow-color", "--glow-color"
]);

const SIZE_VARS = new Set([
  "--border-radius", "--border-width",
  "--shadow-x", "--shadow-y", "--shadow-blur", "--shadow-spread",
  "--backdrop-blur"
]);

const NUMERIC_VARS = new Set([
  "--font-weight", "--font-weight-bold", "--bg-opacity", "--glow-intensity"
]);

function isValidColor(value) {
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) return true;
  if (/^rgba?\(.+\)$/.test(value)) return true;
  if (/^hsla?\(.+\)$/.test(value)) return true;
  if (value === "transparent") return true;
  return false;
}

function isValidSize(value) {
  return /^-?\d+(\.\d+)?(px|em|rem|%)$/.test(value);
}

function isValidNumeric(value) {
  return /^\d+(\.\d+)?$/.test(value);
}

function isValidFontFamily(value) {
  if (value.length > 200) return false;
  if (/[{}()<>]/.test(value)) return false;
  return true;
}

export function parseAIResponse(rawText) {
  const cleaned = rawText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Invalid JSON in AI response");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI response is not a valid object");
  }

  const explanation = typeof parsed.explanation === "string"
    ? parsed.explanation.slice(0, 500)
    : "";

  if (!parsed.variables || typeof parsed.variables !== "object") {
    throw new Error("AI response missing 'variables' field");
  }

  const validated = {};
  const rejected = [];

  for (const [key, value] of Object.entries(parsed.variables)) {
    if (!ALLOWED_VARIABLES.has(key)) {
      rejected.push({ key, reason: "unknown variable" });
      continue;
    }

    const strValue = String(value).trim();
    if (strValue.length === 0 || strValue.length > 300) {
      rejected.push({ key, reason: "invalid value length" });
      continue;
    }

    if (/[{}]/.test(strValue) || /;\s*\w/.test(strValue) || /url\s*\(/i.test(strValue)) {
      rejected.push({ key, reason: "potentially unsafe value" });
      continue;
    }

    if (COLOR_VARS.has(key)) {
      if (!isValidColor(strValue)) {
        rejected.push({ key, reason: "invalid color format" });
        continue;
      }
    } else if (SIZE_VARS.has(key)) {
      if (!isValidSize(strValue)) {
        rejected.push({ key, reason: "invalid size format" });
        continue;
      }
    } else if (NUMERIC_VARS.has(key)) {
      if (!isValidNumeric(strValue)) {
        rejected.push({ key, reason: "invalid numeric value" });
        continue;
      }
    } else if (key === "--font-family") {
      if (!isValidFontFamily(strValue)) {
        rejected.push({ key, reason: "invalid font family" });
        continue;
      }
    }

    validated[key] = strValue;
  }

  if (Object.keys(validated).length === 0) {
    throw new Error("No valid CSS variables in AI response");
  }

  return { explanation, variables: validated, rejected };
}

function buildRequestPayload(userText, history) {
  const key = getApiKey();
  if (!key) throw new Error("API_KEY_MISSING");

  const baseUrl = getActiveBaseUrl();
  if (!baseUrl) throw new Error("NO_BASE_URL");

  const model = getActiveModel();
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history,
    { role: "user", content: buildUserMessage(userText) }
  ];

  return { key, baseUrl, model, messages };
}

function handleResponseStatus(response) {
  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error("API_KEY_INVALID");
    if (status === 429) throw new Error("RATE_LIMITED");
    if (status === 500 || status === 503) throw new Error("SERVER_ERROR");
    throw new Error(`API_ERROR_${status}`);
  }
}

function parseSSEChunks(text) {
  const tokens = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) tokens.push(delta);
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
  return tokens;
}

/**
 * Streaming version: sends request with stream: true and calls onToken for
 * each received token. When streaming completes, calls onDone with the parsed
 * result. Falls back to non-streaming if ReadableStream is unavailable.
 */
export async function chatWithAIStreaming(userText, history = [], { onToken, onDone, onError, signal } = {}) {
  const { key, baseUrl, model, messages } = buildRequestPayload(userText, history);

  let response;
  try {
    response = await fetch(applyProxy(`${baseUrl}/chat/completions`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
      signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === "AbortError") throw fetchErr;
    throw new Error("NETWORK_ERROR");
  }

  handleResponseStatus(response);

  if (!response.body) {
    return chatWithAIFallback(userText, history, { onToken, onDone, onError, signal });
  }

  let fullText = "";
  let sseBuffer = "";

  try {
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += value;
      const parts = sseBuffer.split("\n\n");
      sseBuffer = parts.pop() || "";

      for (const part of parts) {
        const tokens = parseSSEChunks(part);
        for (const token of tokens) {
          fullText += token;
          if (onToken) onToken(token);
        }
      }
    }

    if (sseBuffer.trim()) {
      const tokens = parseSSEChunks(sseBuffer);
      for (const token of tokens) {
        fullText += token;
        if (onToken) onToken(token);
      }
    }

    if (!fullText) throw new Error("EMPTY_RESPONSE");

    const result = parseAIResponse(fullText);
    if (onDone) onDone(result);
    return result;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    if (onError) { onError(err); return; }
    throw err;
  }
}

async function chatWithAIFallback(userText, history, { onDone, onError }) {
  try {
    const result = await chatWithAI(userText, history);
    if (onDone) onDone(result);
    return result;
  } catch (err) {
    if (onError) { onError(err); return; }
    throw err;
  }
}

/**
 * Non-streaming fallback. Kept for compatibility and providers that
 * don't support streaming.
 */
export async function chatWithAI(userText, history = []) {
  const { key, baseUrl, model, messages } = buildRequestPayload(userText, history);

  let response;
  try {
    response = await fetch(applyProxy(`${baseUrl}/chat/completions`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
  } catch {
    throw new Error("NETWORK_ERROR");
  }

  handleResponseStatus(response);

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("RESPONSE_NOT_JSON");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("EMPTY_RESPONSE");

  return parseAIResponse(content);
}
