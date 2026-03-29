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
    format: "openai",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
    modelsEndpoint: true,
    keyPrefix: "AI",
    browserCors: true,
    format: "gemini",
  },
  claude: {
    id: "claude",
    name: "Anthropic Claude",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
    modelsEndpoint: false,
    keyPrefix: "sk-ant-",
    browserCors: true,
    format: "claude",
  },
  opencode_zen: {
    id: "opencode_zen",
    name: "OpenCode Zen",
    baseUrl: "https://opencode.ai/zen/v1",
    defaultModel: "minimax-m2.5-free",
    modelsEndpoint: true,
    keyPrefix: "",
    browserCors: false,
    format: "openai",
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI Compatible)",
    baseUrl: "",
    defaultModel: "gpt-4o-mini",
    modelsEndpoint: false,
    keyPrefix: "",
    browserCors: false,
    format: "openai",
  },
};

let currentProviderId = localStorage.getItem("ai_provider") || "openai";
let customBaseUrl = localStorage.getItem("ai_custom_base_url") || "";
let corsProxyUrl = localStorage.getItem("ai_cors_proxy") || "";
let apiKey = null;
let rememberKey = false;
let providerChangeListeners = [];
const modelListCache = {};

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

function getProviderFormat() {
  return getProvider().format || "openai";
}

function buildRequestHeaders(format, key) {
  const headers = { "Content-Type": "application/json" };
  switch (format) {
    case "gemini":
      break;
    case "claude":
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
      break;
    default:
      headers["Authorization"] = `Bearer ${key}`;
      break;
  }
  return headers;
}

function convertMessagesForGemini(messages) {
  let systemInstruction = null;
  const contents = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }
  return { systemInstruction, contents };
}

function buildStreamUrl(format, baseUrl, model, key) {
  switch (format) {
    case "gemini":
      return `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
    case "claude":
      return `${baseUrl}/messages`;
    default:
      return `${baseUrl}/chat/completions`;
  }
}

function buildNonStreamUrl(format, baseUrl, model, key) {
  switch (format) {
    case "gemini":
      return `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    case "claude":
      return `${baseUrl}/messages`;
    default:
      return `${baseUrl}/chat/completions`;
  }
}

function buildRequestBody(format, model, messages, stream) {
  switch (format) {
    case "gemini": {
      const { systemInstruction, contents } = convertMessagesForGemini(messages);
      const body = {
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      };
      if (systemInstruction) body.systemInstruction = systemInstruction;
      return body;
    }
    case "claude": {
      let system = "";
      const claudeMessages = [];
      for (const msg of messages) {
        if (msg.role === "system") {
          system = msg.content;
        } else {
          claudeMessages.push({ role: msg.role, content: msg.content });
        }
      }
      const body = {
        model,
        max_tokens: 1000,
        messages: claudeMessages,
        temperature: 0.7,
      };
      if (system) body.system = system;
      if (stream) body.stream = true;
      return body;
    }
    default: {
      const body = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      };
      if (stream) body.stream = true;
      return body;
    }
  }
}

function parseSSEChunksByFormat(format, text) {
  if (format === "openai" || !format) return parseSSEChunks(text);

  const tokens = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      if (format === "gemini") {
        const t = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) tokens.push(t);
      } else if (format === "claude") {
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          tokens.push(parsed.delta.text);
        }
      }
    } catch { /* skip malformed */ }
  }
  return tokens;
}

function extractNonStreamingContent(format, data) {
  switch (format) {
    case "gemini":
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    case "claude":
      return data.content?.[0]?.text;
    default:
      return data.choices?.[0]?.message?.content;
  }
}

export async function validateApiKey(key) {
  const baseUrl = getActiveBaseUrl();
  if (!baseUrl) return { valid: false, error: "NO_BASE_URL" };

  const format = getProviderFormat();

  try {
    let response;
    switch (format) {
      case "gemini":
        response = await fetch(
          applyProxy(`${baseUrl}/models?key=${encodeURIComponent(key)}`),
          { method: "GET" }
        );
        break;
      case "claude":
        response = await fetch(applyProxy(`${baseUrl}/messages`), {
          method: "POST",
          headers: buildRequestHeaders("claude", key),
          body: JSON.stringify({
            model: getActiveModel(),
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        break;
      default:
        response = await fetch(applyProxy(`${baseUrl}/models`), {
          method: "GET",
          headers: { "Authorization": `Bearer ${key}` },
        });
        break;
    }
    if (response.ok) return { valid: true };
    if (response.status === 401 || response.status === 403) return { valid: false, error: "API_KEY_INVALID" };
    if (response.status === 429) {
      const detail = await extractErrorDetail(response);
      if (detail && /quota|billing|exceeded|insufficient|plan|budget|credit/i.test(detail)) {
        return { valid: false, error: "QUOTA_EXCEEDED:" + detail };
      }
      return { valid: false, error: "RATE_LIMITED" };
    }
    return { valid: false, error: `API_ERROR_${response.status}` };
  } catch {
    return { valid: false, error: "NETWORK_ERROR" };
  }
}

export async function fetchAvailableModels(key) {
  const provider = getProvider();
  const format = getProviderFormat();
  const baseUrl = getActiveBaseUrl();
  if (!baseUrl || !key) return [];

  if (format === "claude") return [];

  const cacheKey = `${currentProviderId}:${baseUrl}`;
  if (modelListCache[cacheKey]) return modelListCache[cacheKey];

  try {
    let url, headers;
    if (format === "gemini") {
      url = applyProxy(`${baseUrl}/models?key=${encodeURIComponent(key)}`);
      headers = {};
    } else {
      url = applyProxy(`${baseUrl}/models`);
      headers = { "Authorization": `Bearer ${key}` };
    }

    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) return [];

    const data = await response.json();
    let models = [];

    if (format === "gemini") {
      models = (data.models || [])
        .map(m => {
          const id = m.name?.replace(/^models\//, "") || "";
          return { id, name: m.displayName || id };
        })
        .filter(m => m.id);
    } else {
      models = (data.data || data.models || [])
        .map(m => {
          const id = typeof m === "string" ? m : (m.id || m.model || "");
          return { id, name: id };
        })
        .filter(m => m.id);
    }

    models.sort((a, b) => a.id.localeCompare(b.id));

    if (!models.find(m => m.id === provider.defaultModel)) {
      models.unshift({ id: provider.defaultModel, name: provider.defaultModel + " (default)" });
    }

    modelListCache[cacheKey] = models;
    return models;
  } catch {
    return [];
  }
}

export function clearModelCache(providerId) {
  if (providerId) {
    for (const key of Object.keys(modelListCache)) {
      if (key.startsWith(providerId + ":")) delete modelListCache[key];
    }
  } else {
    for (const key of Object.keys(modelListCache)) delete modelListCache[key];
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

async function handleResponseStatus(response) {
  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) throw new Error("API_KEY_INVALID");
    if (status === 429) {
      const detail = await extractErrorDetail(response);
      if (detail && /quota|billing|exceeded|insufficient|plan|budget|credit/i.test(detail)) {
        throw new Error("QUOTA_EXCEEDED:" + detail);
      }
      throw new Error("RATE_LIMITED");
    }
    if (status === 500 || status === 503) throw new Error("SERVER_ERROR");
    throw new Error(`API_ERROR_${status}`);
  }
}

async function extractErrorDetail(response) {
  try {
    const body = await response.clone().json();
    return body?.error?.message || body?.error?.type || body?.message || "";
  } catch {
    return "";
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
  const format = getProviderFormat();
  const url = applyProxy(buildStreamUrl(format, baseUrl, model, key));
  const headers = buildRequestHeaders(format, key);
  const body = buildRequestBody(format, model, messages, true);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === "AbortError") throw fetchErr;
    throw new Error("NETWORK_ERROR");
  }

  await handleResponseStatus(response);

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
        const tokens = parseSSEChunksByFormat(format, part);
        for (const token of tokens) {
          fullText += token;
          if (onToken) onToken(token);
        }
      }
    }

    if (sseBuffer.trim()) {
      const tokens = parseSSEChunksByFormat(format, sseBuffer);
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

export async function generateRandomStylePrompt({ signal } = {}) {
  const key = getApiKey();
  if (!key) throw new Error("API_KEY_MISSING");

  const baseUrl = getActiveBaseUrl();
  if (!baseUrl) throw new Error("NO_BASE_URL");

  const model = getActiveModel();
  const format = getProviderFormat();
  const lang = getLang();

  const systemPrompt = lang === "zh"
    ? `你是一个富有创意的网页设计灵感生成器。请生成一段简短的（1-2句话）、有创意的网页设计风格描述，用作CSS样式生成器的输入提示。描述应包含风格主题、配色方案和视觉特征。仅输出描述文本，不要包含任何解释或格式。每次生成完全不同的风格。`
    : `You are a creative web design inspiration generator. Generate a short (1-2 sentences), creative web design style description to be used as an input prompt for a CSS style generator. The description should include a style theme, color scheme, and visual characteristics. Output ONLY the description text, no explanations or formatting. Generate a completely different style each time.`;

  const userMsg = lang === "zh"
    ? "请生成一个独特的网页设计风格描述。"
    : "Generate a unique web design style description.";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg },
  ];
  const url = applyProxy(buildNonStreamUrl(format, baseUrl, model, key));
  const headers = buildRequestHeaders(format, key);

  const bodyObj = buildRequestBody(format, model, messages, false);
  if (format === "gemini") {
    bodyObj.generationConfig.temperature = 1.2;
    bodyObj.generationConfig.maxOutputTokens = 150;
  } else if (format === "claude") {
    bodyObj.temperature = 1.0;
    bodyObj.max_tokens = 150;
  } else {
    bodyObj.temperature = 1.2;
    bodyObj.max_tokens = 150;
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyObj),
      signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === "AbortError") throw fetchErr;
    throw new Error("NETWORK_ERROR");
  }

  await handleResponseStatus(response);

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("RESPONSE_NOT_JSON");
  }

  const content = extractNonStreamingContent(format, data)?.trim();
  if (!content) throw new Error("EMPTY_RESPONSE");

  return content;
}

/**
 * Non-streaming fallback. Kept for compatibility and providers that
 * don't support streaming.
 */
export async function chatWithAI(userText, history = []) {
  const { key, baseUrl, model, messages } = buildRequestPayload(userText, history);
  const format = getProviderFormat();
  const url = applyProxy(buildNonStreamUrl(format, baseUrl, model, key));
  const headers = buildRequestHeaders(format, key);
  const body = buildRequestBody(format, model, messages, false);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("NETWORK_ERROR");
  }

  await handleResponseStatus(response);

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("RESPONSE_NOT_JSON");
  }

  const content = extractNonStreamingContent(format, data);
  if (!content) throw new Error("EMPTY_RESPONSE");

  return parseAIResponse(content);
}
