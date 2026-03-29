import {
  getApiKey, setApiKey, clearApiKey,
  validateApiKey, chatWithAIStreaming, chatWithAI,
  PROVIDERS, getProviderId, setProvider,
  getCustomBaseUrl, setCustomBaseUrl,
  getCustomModel, setCustomModel,
  getCorsProxy, setCorsProxy, needsCorsProxy,
  onProviderChange
} from "./ai-service.js";
import { applyValidatedVariables } from "./css-var-manager.js";
import { t, onLangChange } from "./i18n.js";

let msgIdCounter = 0;
function nextMsgId() {
  return `msg_${++msgIdCounter}`;
}

function createInitialState() {
  return {
    messages: [],
    isLoading: false,
    streamingText: "",
    abortController: null,
    apiKeySet: !!getApiKey(),
  };
}

export function createChatStore() {
  let state = createInitialState();
  let listeners = new Set();
  const cleanups = [];

  function notify() {
    for (const fn of listeners) {
      try { fn(state); } catch (_) { /* ignore */ }
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getState() {
    return state;
  }

  function buildHistoryForAPI() {
    const pairs = [];
    for (const m of state.messages) {
      if (m.role === "user") {
        pairs.push({ role: "user", content: m.content });
      } else if (m.role === "assistant" && m.explanation) {
        pairs.push({ role: "assistant", content: m.explanation });
      }
    }
    return pairs.slice(-10);
  }

  async function send(text) {
    if (!text || state.isLoading) return;
    if (!getApiKey()) return;

    const userMsg = {
      id: nextMsgId(),
      role: "user",
      content: text,
    };
    state.messages = [...state.messages, userMsg];
    state.isLoading = true;
    state.streamingText = "";

    const abortController = new AbortController();
    state.abortController = abortController;
    notify();

    const history = buildHistoryForAPI().slice(0, -1);
    const assistantMsgId = nextMsgId();

    try {
      await chatWithAIStreaming(text, history, {
        signal: abortController.signal,
        onToken(token) {
          state.streamingText += token;
          notify();
        },
        onDone(result) {
          const assistantMsg = {
            id: assistantMsgId,
            role: "assistant",
            explanation: result.explanation,
            variables: result.variables,
            rejected: result.rejected,
            applied: false,
          };
          state.messages = [...state.messages, assistantMsg];
          state.isLoading = false;
          state.streamingText = "";
          state.abortController = null;
          notify();
        },
        onError(err) {
          handleError(err, assistantMsgId);
        },
      });
    } catch (err) {
      if (err.name === "AbortError") {
        state.isLoading = false;
        state.streamingText = "";
        state.abortController = null;
        notify();
        return;
      }
      handleError(err, assistantMsgId);
    }
  }

  function handleError(err, assistantMsgId) {
    const rawMsg = err.message || "UNKNOWN";
    const errorKey = getErrorI18nKey(rawMsg);
    let errorText = t(errorKey);
    if (rawMsg.startsWith("QUOTA_EXCEEDED:")) {
      const apiDetail = rawMsg.slice("QUOTA_EXCEEDED:".length).trim();
      if (apiDetail) errorText += "\n(" + apiDetail + ")";
    }
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      explanation: "",
      error: errorText,
      originalUserText: getLastUserText(),
    };
    state.messages = [...state.messages, assistantMsg];
    state.isLoading = false;
    state.streamingText = "";
    state.abortController = null;
    notify();
  }

  function getLastUserText() {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].role === "user") return state.messages[i].content;
    }
    return "";
  }

  function abort() {
    if (state.abortController) {
      state.abortController.abort();
      state.isLoading = false;
      state.streamingText = "";
      state.abortController = null;
      notify();
    }
  }

  function retry() {
    const lastUserText = getLastUserText();
    if (!lastUserText) return;

    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.error) {
      state.messages = state.messages.slice(0, -1);
      notify();
    }

    send(lastUserText);
  }

  function applyVariables(msgId) {
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg || !msg.variables || msg.applied) return;

    applyValidatedVariables(msg.variables);
    state.messages = state.messages.map(m =>
      m.id === msgId ? { ...m, applied: true } : m
    );
    notify();
  }

  function updateApiKey(key, remember) {
    setApiKey(key, remember);
    state.apiKeySet = !!key;
    notify();
  }

  function removeApiKey() {
    clearApiKey();
    state.apiKeySet = false;
    notify();
  }

  function refreshApiKeyState() {
    state.apiKeySet = !!getApiKey();
    notify();
  }

  const unsubProvider = onProviderChange(() => {
    state.apiKeySet = !!getApiKey();
    notify();
  });
  cleanups.push(unsubProvider);

  const unsubLang = onLangChange(() => {
    notify();
  });
  cleanups.push(unsubLang);

  function destroy() {
    for (const fn of cleanups) fn();
    listeners.clear();
  }

  return {
    subscribe,
    getState,
    send,
    abort,
    retry,
    applyVariables,
    updateApiKey,
    removeApiKey,
    refreshApiKeyState,
    validateApiKey,
    destroy,
  };
}

function getErrorI18nKey(errorMessage) {
  if (errorMessage.startsWith("QUOTA_EXCEEDED:")) return "ai.error.quotaExceeded";
  switch (errorMessage) {
    case "API_KEY_MISSING": return "ai.error.noKey";
    case "API_KEY_INVALID": return "ai.error.invalidKey";
    case "RATE_LIMITED": return "ai.error.rateLimit";
    case "SERVER_ERROR": return "ai.error.serverError";
    case "NO_BASE_URL": return "ai.error.noBaseUrl";
    case "NETWORK_ERROR": return "ai.error.network";
    case "RESPONSE_NOT_JSON": return "ai.error.responseFormat";
    case "EMPTY_RESPONSE": return "ai.error.emptyResponse";
    default:
      if (errorMessage.startsWith("API_ERROR_")) return "ai.error.generic";
      return "ai.error.parse";
  }
}
