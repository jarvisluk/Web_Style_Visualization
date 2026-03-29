import {
  getApiKey, setApiKey, clearApiKey,
  validateApiKey, generateRandomStylePrompt,
  PROVIDERS, getProviderId, setProvider,
  getCustomBaseUrl, setCustomBaseUrl,
  getModel, setModel,
  getCustomModel, setCustomModel,
  getCorsProxy, setCorsProxy, needsCorsProxy,
} from "../utils/ai-service.js";
import { t, getLang, onLangChange } from "../utils/i18n.js";
import { createChatStore } from "../utils/chat-store.js";

const RANDOM_PROMPT_PARTS = {
  en: {
    first: [
      "Cyberpunk style",
      "Minimalist Scandinavian design",
      "Retro 80s arcade theme",
      "Elegant luxury brand style",
      "High-contrast brutalist design",
      "Futuristic space theme",
      "Japanese zen garden",
      "Vibrant pop art style",
      "Cozy coffee shop vibes",
      "Frosted glassmorphism",
    ],
    second: [
      "with neon purple and cyan glow on a dark background",
      "with soft oranges, cream whites, and golden accents",
      "with muted pastels and lots of white space",
      "with electric pink, seafoam green, and dark navy",
      "with deep greens, earthy browns, and warm shadows",
      "with bold black and white, no rounded corners",
      "with dark indigo, starlight silver, and glowing cyan",
      "with hot pink, electric blue, and pitch black",
      "with sepia tones, serif fonts, and a classic feel",
      "with icy blue, snow white, and frosted glass effects",
    ],
  },
  zh: {
    first: [
      "赛博朋克风格",
      "极简北欧设计",
      "复古80年代街机风",
      "优雅奢侈品牌风",
      "高对比度野兽派设计",
      "未来太空主题",
      "日式禅意花园",
      "鲜艳波普艺术风",
      "温馨咖啡馆氛围",
      "毛玻璃拟态风格",
    ],
    second: [
      "搭配霓虹紫与青色光芒、深色背景",
      "搭配柔和橙色、奶油白、金色点缀",
      "搭配柔和粉彩色调、大量留白",
      "搭配电光粉、海沫绿、深海军蓝",
      "搭配深绿色、大地棕色、温暖阴影",
      "搭配粗犷黑白、无圆角",
      "搭配深靛蓝、星光银、发光青色",
      "搭配热粉红、电蓝、漆黑底色",
      "搭配泛黄色调、衬线字体、经典感",
      "搭配冰蓝、雪白、毛玻璃效果",
    ],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrompt() {
  const lang = getLang();
  const parts = RANDOM_PROMPT_PARTS[lang] || RANDOM_PROMPT_PARTS.en;
  const sep = lang === "zh" ? "，" : ", ";
  return pick(parts.first) + sep + pick(parts.second);
}

export function renderAIChat(container) {
  const store = createChatStore();
  const cleanups = [];
  let renderedMsgCount = 0;
  let prevIsLoading = false;
  let prevStreamingText = "";
  let prevApiKeySet = false;

  // ── refs that persist across updates ──
  let $wrapper, $messagesEl, $placeholder, $typingBubble, $textarea;
  let $providerContainer, $keyContainer;
  let $sendBtn, $stopBtn;

  function initialRender() {
    container.innerHTML = "";

    $wrapper = el("div", "ai-chat-wrapper");

    // Header
    const header = el("div", "ai-chat-header");
    const titleEl = el("span", "ai-chat-title");
    titleEl.textContent = t("ai.title");
    header.appendChild(titleEl);
    $wrapper.appendChild(header);

    // Provider
    $providerContainer = el("div");
    $wrapper.appendChild($providerContainer);
    renderProviderSection();

    // Key
    $keyContainer = el("div");
    $wrapper.appendChild($keyContainer);
    renderKeySection();

    // Messages
    $messagesEl = el("div", "ai-chat-messages");
    $messagesEl.id = "ai-chat-messages";
    $placeholder = el("div", "ai-chat-placeholder");
    $placeholder.textContent = t("ai.placeholder");
    $messagesEl.appendChild($placeholder);
    $wrapper.appendChild($messagesEl);

    // Typing bubble (hidden by default)
    $typingBubble = el("div", "ai-chat-bubble ai-chat-bubble-assistant ai-chat-streaming-bubble");
    $typingBubble.style.display = "none";
    const typingText = el("div", "ai-chat-bubble-text ai-chat-streaming-text");
    $typingBubble.appendChild(typingText);
    $messagesEl.appendChild($typingBubble);

    // Input area
    const inputArea = el("div", "ai-chat-input-area");

    const randomWrap = el("div", "ai-chat-random-wrap");
    const randomBtn = el("button", "btn btn-ghost ai-chat-random");
    randomBtn.title = t("ai.randomTip");
    const shuffleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`;
    randomBtn.innerHTML = shuffleIcon;

    const randomMenu = el("div", "ai-chat-random-menu");
    randomMenu.style.display = "none";

    function buildRandomMenu() {
      randomMenu.innerHTML = "";

      const localItem = el("button", "ai-chat-random-menu-item");
      localItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg><span>${t("ai.randomLocal")}</span>`;
      localItem.addEventListener("click", () => {
        randomMenu.style.display = "none";
        $textarea.value = getRandomPrompt();
        autoGrow($textarea);
        $textarea.focus();
      });
      randomMenu.appendChild(localItem);

      if (getApiKey()) {
        const aiItem = el("button", "ai-chat-random-menu-item ai-chat-random-menu-item-ai");
        aiItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.2-.5 2.3-1.4 3H9.4A4 4 0 0 1 12 2z"/><path d="M12 9v4"/><path d="M8 13h8"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/><path d="M7 17H5a2 2 0 0 1-2-2V9"/><path d="M17 17h2a2 2 0 0 0 2-2V9"/></svg><span>${t("ai.randomAI")}</span>`;
        aiItem.addEventListener("click", async () => {
          randomMenu.style.display = "none";
          randomBtn.disabled = true;
          randomBtn.classList.add("loading");
          randomBtn.innerHTML = `<span class="ai-chat-random-spinner"></span>`;
          try {
            const prompt = await generateRandomStylePrompt();
            $textarea.value = prompt;
            autoGrow($textarea);
            $textarea.focus();
          } catch {
            $textarea.value = getRandomPrompt();
            autoGrow($textarea);
            $textarea.focus();
          } finally {
            randomBtn.disabled = false;
            randomBtn.classList.remove("loading");
            randomBtn.innerHTML = shuffleIcon;
          }
        });
        randomMenu.appendChild(aiItem);
      }
    }

    let menuCloseTimer;
    randomBtn.addEventListener("click", () => {
      if (!getApiKey()) {
        $textarea.value = getRandomPrompt();
        autoGrow($textarea);
        $textarea.focus();
        return;
      }
      buildRandomMenu();
      const isVisible = randomMenu.style.display !== "none";
      randomMenu.style.display = isVisible ? "none" : "";
    });

    randomWrap.addEventListener("mouseenter", () => clearTimeout(menuCloseTimer));
    randomWrap.addEventListener("mouseleave", () => {
      menuCloseTimer = setTimeout(() => { randomMenu.style.display = "none"; }, 300);
    });

    randomWrap.appendChild(randomBtn);
    randomWrap.appendChild(randomMenu);

    $textarea = el("textarea", "ai-chat-input");
    $textarea.placeholder = t("ai.inputPlaceholder");
    $textarea.rows = 1;
    $textarea.id = "ai-chat-textarea";
    $textarea.addEventListener("input", () => autoGrow($textarea));
    $textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    $sendBtn = el("button", "btn btn-primary ai-chat-send");
    $sendBtn.textContent = t("ai.send");
    $sendBtn.addEventListener("click", handleSend);

    $stopBtn = el("button", "btn btn-accent ai-chat-stop");
    $stopBtn.textContent = t("ai.stop");
    $stopBtn.style.display = "none";
    $stopBtn.addEventListener("click", () => store.abort());

    inputArea.appendChild(randomWrap);
    inputArea.appendChild($textarea);
    inputArea.appendChild($sendBtn);
    inputArea.appendChild($stopBtn);
    $wrapper.appendChild(inputArea);

    container.appendChild($wrapper);
  }

  function handleSend() {
    const text = $textarea.value.trim();
    if (!text) return;

    if (!getApiKey()) {
      const keyInput = container.querySelector(".ai-chat-key-input");
      if (keyInput) keyInput.focus();
      return;
    }

    $textarea.value = "";
    autoGrow($textarea);
    store.send(text);
  }

  // ── Incremental updates on state change ──

  function onStateChange(state) {
    updateMessages(state);
    updateStreamingUI(state);
    updateLoadingUI(state);
    updateApiKeyUI(state);
  }

  function updateMessages(state) {
    const { messages } = state;

    if (messages.length === 0 && renderedMsgCount === 0) return;

    if (messages.length > 0 && $placeholder && $placeholder.parentNode) {
      $placeholder.remove();
    }

    while (renderedMsgCount < messages.length) {
      const msg = messages[renderedMsgCount];
      const bubble = buildMessageBubble(msg);
      $messagesEl.insertBefore(bubble, $typingBubble);
      renderedMsgCount++;
    }

    scrollToBottom();
  }

  function updateStreamingUI(state) {
    const { streamingText, isLoading } = state;

    if (isLoading && streamingText) {
      $typingBubble.style.display = "";
      const textEl = $typingBubble.querySelector(".ai-chat-streaming-text");
      textEl.textContent = streamingText;
      $typingBubble.classList.add("streaming");
      scrollToBottom();
    } else if (isLoading && !streamingText) {
      $typingBubble.style.display = "";
      const textEl = $typingBubble.querySelector(".ai-chat-streaming-text");
      if (!textEl.querySelector(".ai-chat-typing")) {
        textEl.textContent = "";
        const dots = el("div", "ai-chat-typing");
        dots.innerHTML = "<span></span><span></span><span></span>";
        textEl.appendChild(dots);
      }
      $typingBubble.classList.remove("streaming");
    } else {
      $typingBubble.style.display = "none";
      $typingBubble.classList.remove("streaming");
      const textEl = $typingBubble.querySelector(".ai-chat-streaming-text");
      textEl.textContent = "";
    }

    prevStreamingText = streamingText;
  }

  function updateLoadingUI(state) {
    const { isLoading } = state;
    if (isLoading === prevIsLoading) return;
    prevIsLoading = isLoading;

    $sendBtn.style.display = isLoading ? "none" : "";
    $stopBtn.style.display = isLoading ? "" : "none";
    $textarea.disabled = isLoading;
  }

  function updateApiKeyUI(state) {
    if (state.apiKeySet !== prevApiKeySet) {
      prevApiKeySet = state.apiKeySet;
      renderKeySection();
    }
  }

  // ── Provider section (rebuilt on provider change) ──

  function renderProviderSection() {
    $providerContainer.innerHTML = "";
    const section = el("div", "ai-chat-provider-section");

    const row = el("div", "ai-chat-provider-row");
    const label = el("span", "ai-chat-provider-label");
    label.textContent = t("ai.provider");

    const select = el("select", "ai-chat-provider-select");
    for (const [id, provider] of Object.entries(PROVIDERS)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = provider.name;
      if (id === getProviderId()) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener("change", () => {
      setProvider(select.value);
      renderProviderSection();
      renderKeySection();
      store.refreshApiKeyState();
    });

    row.appendChild(label);
    row.appendChild(select);
    section.appendChild(row);

    if (getProviderId() === "opencode_zen") {
      const tip = el("div", "ai-chat-provider-tip");
      tip.innerHTML = `<a href="https://opencode.ai/auth" target="_blank" rel="noopener noreferrer">${t("ai.providerOpenCodeZenTip")}</a>`;
      section.appendChild(tip);
    }

    if (getProviderId() === "gemini") {
      const tip = el("div", "ai-chat-provider-tip");
      tip.innerHTML = `<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">${t("ai.providerGeminiTip")}</a>`;
      section.appendChild(tip);
    }

    if (getProviderId() === "claude") {
      const tip = el("div", "ai-chat-provider-tip");
      tip.innerHTML = `<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">${t("ai.providerClaudeTip")}</a>`;
      section.appendChild(tip);
    }

    if (getProviderId() === "custom") {
      section.appendChild(buildCustomRow(
        t("ai.providerCustomUrl"),
        t("ai.providerCustomUrlPlaceholder"),
        getCustomBaseUrl(),
        (val) => setCustomBaseUrl(val)
      ));
    }

    {
      const currentProvider = PROVIDERS[getProviderId()];
      const modelValue = getProviderId() === "custom" ? getCustomModel() : getModel();
      section.appendChild(buildCustomRow(
        t("ai.model"),
        currentProvider.defaultModel,
        modelValue,
        (val) => {
          if (getProviderId() === "custom") {
            setCustomModel(val);
          } else {
            setModel(val);
          }
        }
      ));
    }

    if (needsCorsProxy()) {
      section.appendChild(buildCustomRow(
        t("ai.corsProxy"),
        t("ai.corsProxyPlaceholder"),
        getCorsProxy(),
        (val) => setCorsProxy(val)
      ));
      const proxyHint = el("div", "ai-chat-provider-tip");
      proxyHint.innerHTML = t("ai.corsProxyHint");
      section.appendChild(proxyHint);
    }

    $providerContainer.appendChild(section);
  }

  function buildCustomRow(labelText, placeholder, value, onChange) {
    const row = el("div", "ai-chat-provider-custom-row");
    const lbl = el("span", "ai-chat-provider-custom-label");
    lbl.textContent = labelText;
    const input = el("input", "ai-chat-provider-custom-input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = value;
    input.addEventListener("change", () => onChange(input.value.trim()));
    row.appendChild(lbl);
    row.appendChild(input);
    return row;
  }

  // ── Key section (rebuilt only when key state changes) ──

  function renderKeySection() {
    $keyContainer.innerHTML = "";
    const section = el("div", "ai-chat-key-section");
    const hasKey = !!getApiKey();
    prevApiKeySet = hasKey;

    if (hasKey) {
      const row = el("div", "ai-chat-key-row");
      const status = el("span", "ai-chat-key-status");
      status.textContent = t("ai.keySet");
      const clearBtn = el("button", "btn btn-ghost btn-sm");
      clearBtn.textContent = t("ai.keyClear");
      clearBtn.addEventListener("click", () => {
        store.removeApiKey();
        renderKeySection();
      });
      row.appendChild(status);
      row.appendChild(clearBtn);
      section.appendChild(row);
    } else {
      const row = el("div", "ai-chat-key-row");

      const input = el("input", "ai-chat-key-input");
      input.type = "password";
      input.placeholder = t("ai.keyPlaceholder");
      input.autocomplete = "off";
      input.setAttribute("data-1p-ignore", "");
      input.setAttribute("data-lpignore", "true");
      input.setAttribute("data-form-type", "other");

      const rememberLabel = el("label", "ai-chat-remember-label");
      const rememberCheck = el("input", "ai-chat-remember-check");
      rememberCheck.type = "checkbox";
      rememberLabel.appendChild(rememberCheck);
      rememberLabel.appendChild(document.createTextNode(" " + t("ai.keyRemember")));

      const saveBtn = el("button", "btn btn-primary btn-sm");
      saveBtn.textContent = t("ai.keySave");

      const statusMsg = el("span", "ai-chat-key-verify-status");

      async function handleSaveKey() {
        const val = input.value.trim();
        if (!val) return;
        saveBtn.disabled = true;
        input.disabled = true;
        statusMsg.textContent = t("ai.keyVerifying");
        statusMsg.className = "ai-chat-key-verify-status verifying";

        const result = await validateApiKey(val);

        if (result.valid) {
          store.updateApiKey(val, rememberCheck.checked);
          renderKeySection();
        } else if (result.error === "NETWORK_ERROR") {
          store.updateApiKey(val, rememberCheck.checked);
          statusMsg.textContent = t("ai.keyNetworkError");
          statusMsg.className = "ai-chat-key-verify-status warning";
          setTimeout(() => renderKeySection(), 1500);
        } else {
          saveBtn.disabled = false;
          input.disabled = false;
          statusMsg.textContent = t("ai.keyInvalid");
          statusMsg.className = "ai-chat-key-verify-status error";
        }
      }

      saveBtn.addEventListener("click", handleSaveKey);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); handleSaveKey(); }
      });

      row.appendChild(input);
      row.appendChild(rememberLabel);
      row.appendChild(saveBtn);
      row.appendChild(statusMsg);
      section.appendChild(row);

      const notice = el("div", "ai-chat-security-notice");
      notice.textContent = t("ai.securityNotice");
      section.appendChild(notice);
    }

    $keyContainer.appendChild(section);
  }

  // ── Message bubble builder ──

  function buildMessageBubble(msg) {
    const bubble = el("div", `ai-chat-bubble ai-chat-bubble-${msg.role}`);

    const text = el("div", "ai-chat-bubble-text");
    text.textContent = msg.role === "user" ? msg.content : msg.explanation;
    bubble.appendChild(text);

    if (msg.role === "assistant" && msg.variables) {
      const varList = el("div", "ai-chat-var-list");

      for (const [key, value] of Object.entries(msg.variables)) {
        const item = el("div", "ai-chat-var-item");
        const nameEl = el("span", "ai-chat-var-name");
        nameEl.textContent = key;
        const valueEl = el("span", "ai-chat-var-value");
        valueEl.textContent = value;

        if (key.includes("color") || key === "--shadow-color" || key === "--glow-color") {
          const swatch = el("span", "ai-chat-color-swatch");
          swatch.style.backgroundColor = value;
          valueEl.prepend(swatch);
        }

        item.appendChild(nameEl);
        item.appendChild(valueEl);
        varList.appendChild(item);
      }
      bubble.appendChild(varList);

      if (msg.rejected && msg.rejected.length > 0) {
        const rejectedEl = el("div", "ai-chat-rejected");
        rejectedEl.textContent = t("ai.rejected") + ": " +
          msg.rejected.map(r => `${r.key} (${r.reason})`).join(", ");
        bubble.appendChild(rejectedEl);
      }

      const applyBtn = el("button", "btn btn-primary btn-sm ai-chat-apply-btn");
      applyBtn.textContent = msg.applied ? t("ai.applied") : t("ai.apply");
      if (msg.applied) {
        applyBtn.disabled = true;
        applyBtn.classList.add("applied");
      }
      applyBtn.addEventListener("click", () => {
        store.applyVariables(msg.id);
        applyBtn.textContent = t("ai.applied");
        applyBtn.disabled = true;
        applyBtn.classList.add("applied");
      });
      bubble.appendChild(applyBtn);
    }

    if (msg.role === "assistant" && msg.error) {
      const errorEl = el("div", "ai-chat-error");
      errorEl.textContent = msg.error;
      bubble.appendChild(errorEl);

      const retryBtn = el("button", "btn btn-ghost btn-sm ai-chat-retry-btn");
      retryBtn.textContent = t("ai.retry");
      retryBtn.addEventListener("click", () => store.retry());
      bubble.appendChild(retryBtn);
    }

    return bubble;
  }

  // ── Language change: full rebuild of static text ──

  function onLangChanged() {
    renderedMsgCount = 0;
    prevIsLoading = false;
    prevStreamingText = "";
    prevApiKeySet = false;
    initialRender();
    onStateChange(store.getState());
  }

  // ── Helpers ──

  function el(tag, className) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function autoGrow(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (!$messagesEl) return;
      const threshold = 80;
      const distFromBottom = $messagesEl.scrollHeight - $messagesEl.scrollTop - $messagesEl.clientHeight;
      if (distFromBottom < threshold || store.getState().isLoading) {
        $messagesEl.scrollTop = $messagesEl.scrollHeight;
      }
    });
  }

  // ── Bootstrap ──

  initialRender();

  const unsubStore = store.subscribe(onStateChange);
  cleanups.push(unsubStore);

  const unsubLang = onLangChange(onLangChanged);
  cleanups.push(unsubLang);

  onStateChange(store.getState());

  return function destroy() {
    for (const fn of cleanups) fn();
    store.destroy();
  };
}
