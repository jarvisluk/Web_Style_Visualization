import {
  getApiKey, setApiKey, clearApiKey,
  validateApiKey, generateRandomStylePrompt,
  PROVIDERS, getProviderId, setProvider,
  getCustomBaseUrl, setCustomBaseUrl,
  getModel, setModel,
  getCustomModel, setCustomModel,
  getCorsProxy, setCorsProxy, needsCorsProxy,
  fetchAvailableModels, clearModelCache,
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

let _chatStyleInjected = false;
function injectChatAnimations() {
  if (_chatStyleInjected) return;
  _chatStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = [
    "@keyframes _chat-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}",
    "@keyframes _chat-cursor{0%,100%{opacity:1}50%{opacity:0}}",
    "@keyframes _chat-spin{to{transform:rotate(360deg)}}",
    "@keyframes _chat-menu-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}",
    "[data-chat-streaming] [data-chat-stream-text]::after{content:\"\";display:inline-block;width:2px;height:1em;background:var(--color-primary);margin-left:2px;vertical-align:text-bottom;animation:_chat-cursor .8s step-end infinite}",
  ].join("\n");
  document.head.appendChild(style);
}

export function renderAIChat(container) {
  injectChatAnimations();

  const store = createChatStore();
  const cleanups = [];
  let renderedMsgCount = 0;
  let prevIsLoading = false;
  let prevStreamingText = "";
  let prevApiKeySet = false;

  let $wrapper, $messagesEl, $placeholder, $typingBubble, $typingText, $textarea;
  let $providerContainer, $keyContainer;
  let $sendBtn, $stopBtn;

  function initialRender() {
    container.innerHTML = "";

    $wrapper = el("div", "card");
    Object.assign($wrapper.style, { display: "flex", flexDirection: "column", overflow: "hidden" });

    // Header
    const header = el("div");
    Object.assign(header.style, {
      padding: "var(--spacing) var(--spacing-lg)",
      borderBottom: "var(--border-width) solid var(--border-color)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    });
    const titleEl = el("span");
    Object.assign(titleEl.style, {
      fontSize: "var(--font-size-lg)",
      fontWeight: "var(--font-weight-bold)",
      color: "var(--color-primary)",
    });
    titleEl.textContent = t("ai.title");
    header.appendChild(titleEl);
    $wrapper.appendChild(header);

    // Provider
    $providerContainer = el("div");
    $wrapper.appendChild($providerContainer);
    renderProviderSection();

    // Key + Model
    $keyContainer = el("div");
    $wrapper.appendChild($keyContainer);
    renderKeySection();

    // Messages
    $messagesEl = el("div");
    Object.assign($messagesEl.style, {
      padding: "var(--spacing-lg)",
      maxHeight: "400px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing)",
      flex: "1",
    });
    $messagesEl.id = "ai-chat-messages";

    $placeholder = el("div");
    Object.assign($placeholder.style, {
      textAlign: "center",
      color: "var(--color-text-secondary)",
      fontSize: "var(--font-size-sm)",
      padding: "var(--spacing-xl) 0",
      opacity: "0.7",
    });
    $placeholder.textContent = t("ai.placeholder");
    $messagesEl.appendChild($placeholder);
    $wrapper.appendChild($messagesEl);

    // Typing bubble (hidden)
    $typingBubble = el("div");
    applyBubbleStyle($typingBubble, "assistant");
    $typingBubble.style.display = "none";
    $typingText = el("div");
    $typingText.dataset.chatStreamText = "";
    $typingBubble.appendChild($typingText);
    $messagesEl.appendChild($typingBubble);

    // Input area
    const inputArea = el("div");
    Object.assign(inputArea.style, {
      display: "flex",
      gap: "var(--spacing-sm)",
      padding: "var(--spacing) var(--spacing-lg)",
      background: "var(--color-bg)",
      alignItems: "flex-end",
      borderTop: "var(--border-width) solid var(--border-color)",
    });

    const randomWrap = el("div");
    Object.assign(randomWrap.style, { position: "relative", flexShrink: "0" });

    const randomBtn = el("button", "btn btn-ghost");
    Object.assign(randomBtn.style, {
      width: "calc(var(--font-size-sm) * var(--line-height) + var(--spacing-sm) * 2)",
      height: "calc(var(--font-size-sm) * var(--line-height) + var(--spacing-sm) * 2)",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "calc(var(--border-radius) / 2)",
      border: "none",
      background: "transparent",
    });
    randomBtn.title = t("ai.randomTip");
    const shuffleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`;
    randomBtn.innerHTML = shuffleIcon;

    const randomMenu = el("div");
    Object.assign(randomMenu.style, {
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: "0",
      background: "var(--color-surface)",
      border: "var(--border-width) solid var(--color-border)",
      borderRadius: "var(--border-radius)",
      boxShadow: "var(--shadow-x) calc(var(--shadow-y) * -1) var(--shadow-blur) var(--shadow-spread) var(--shadow-color)",
      padding: "4px",
      zIndex: "100",
      minWidth: "140px",
      animation: "_chat-menu-in 0.15s ease-out",
      display: "none",
    });

    function buildRandomMenuItem(iconSvg, labelText, isAI) {
      const item = el("button");
      Object.assign(item.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "8px 12px",
        border: "none",
        background: "transparent",
        color: "var(--color-text)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        borderRadius: "calc(var(--border-radius) / 2)",
        whiteSpace: "nowrap",
      });
      item.innerHTML = iconSvg + `<span>${labelText}</span>`;
      if (isAI) {
        const span = item.querySelector("span");
        Object.assign(span.style, {
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontWeight: "var(--font-weight-bold)",
        });
        const svg = item.querySelector("svg");
        if (svg) svg.style.color = "var(--color-primary)";
      } else {
        const svg = item.querySelector("svg");
        if (svg) svg.style.color = "var(--color-text-secondary)";
      }
      item.addEventListener("mouseenter", () => { item.style.background = "var(--color-bg)"; });
      item.addEventListener("mouseleave", () => { item.style.background = "transparent"; });
      return item;
    }

    function buildRandomMenu() {
      randomMenu.innerHTML = "";

      const localItem = buildRandomMenuItem(
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
        t("ai.randomLocal"),
        false
      );
      localItem.addEventListener("click", () => {
        randomMenu.style.display = "none";
        $textarea.value = getRandomPrompt();
        autoGrow($textarea);
        $textarea.focus();
      });
      randomMenu.appendChild(localItem);

      if (getApiKey()) {
        const aiItem = buildRandomMenuItem(
          `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.2-.5 2.3-1.4 3H9.4A4 4 0 0 1 12 2z"/><path d="M12 9v4"/><path d="M8 13h8"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/><path d="M7 17H5a2 2 0 0 1-2-2V9"/><path d="M17 17h2a2 2 0 0 0 2-2V9"/></svg>`,
          t("ai.randomAI"),
          true
        );
        aiItem.addEventListener("click", async () => {
          randomMenu.style.display = "none";
          randomBtn.disabled = true;
          randomBtn.style.pointerEvents = "none";
          randomBtn.style.opacity = "0.6";
          randomBtn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border:2px solid var(--color-border);border-top-color:var(--color-primary);border-radius:50%;animation:_chat-spin .6s linear infinite"></span>`;
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
            randomBtn.style.pointerEvents = "";
            randomBtn.style.opacity = "";
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

    $textarea = el("textarea", "form-textarea");
    Object.assign($textarea.style, {
      flex: "1",
      resize: "none",
      minHeight: "calc(var(--font-size-sm) * var(--line-height) + var(--spacing-sm) * 2 + var(--border-width) * 2)",
      maxHeight: "120px",
    });
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

    $sendBtn = el("button", "btn btn-primary");
    Object.assign($sendBtn.style, {
      whiteSpace: "nowrap",
      height: "calc(var(--font-size-sm) * var(--line-height) + var(--spacing-sm) * 2)",
      padding: "0 var(--spacing-lg)",
    });
    $sendBtn.textContent = t("ai.send");
    $sendBtn.addEventListener("click", handleSend);

    $stopBtn = el("button", "btn btn-accent");
    Object.assign($stopBtn.style, {
      whiteSpace: "nowrap",
      height: "calc(var(--font-size-sm) * var(--line-height) + var(--spacing-sm) * 2)",
      padding: "0 var(--spacing-lg)",
      display: "none",
    });
    $stopBtn.textContent = t("ai.stop");
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
      const keyInput = container.querySelector("[data-role='key-input']");
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
      $typingText.textContent = streamingText;
      $typingBubble.dataset.chatStreaming = "";
      scrollToBottom();
    } else if (isLoading && !streamingText) {
      $typingBubble.style.display = "";
      if (!$typingText.querySelector("[data-typing-dots]")) {
        $typingText.textContent = "";
        const dots = el("div");
        dots.dataset.typingDots = "";
        Object.assign(dots.style, { display: "flex", gap: "4px", padding: "4px 0" });
        for (let i = 0; i < 3; i++) {
          const dot = el("span");
          Object.assign(dot.style, {
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--color-text-secondary)",
            animation: `_chat-blink 1.4s ${i * 0.2}s infinite both`,
          });
          dots.appendChild(dot);
        }
        $typingText.appendChild(dots);
      }
      delete $typingBubble.dataset.chatStreaming;
    } else {
      $typingBubble.style.display = "none";
      delete $typingBubble.dataset.chatStreaming;
      $typingText.textContent = "";
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

  // ── Provider section ──

  function renderProviderSection() {
    $providerContainer.innerHTML = "";
    const section = el("div");
    Object.assign(section.style, {
      padding: "var(--spacing-sm) var(--spacing-lg)",
      borderBottom: "var(--border-width) solid var(--border-color)",
      background: "var(--color-bg)",
    });

    const row = el("div");
    Object.assign(row.style, { display: "flex", alignItems: "center", gap: "var(--spacing-sm)" });

    const label = el("span");
    Object.assign(label.style, {
      fontSize: "var(--font-size-sm)",
      color: "var(--color-text-secondary)",
      whiteSpace: "nowrap",
      fontWeight: "500",
    });
    label.textContent = t("ai.provider");

    const select = el("select", "form-select");
    Object.assign(select.style, { flex: "1", width: "auto" });
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
      section.appendChild(buildTip(
        `<a href="https://opencode.ai/auth" target="_blank" rel="noopener noreferrer">${t("ai.providerOpenCodeZenTip")}</a>`
      ));
    }

    if (getProviderId() === "gemini") {
      section.appendChild(buildTip(
        `<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">${t("ai.providerGeminiTip")}</a>`
      ));
    }

    if (getProviderId() === "claude") {
      section.appendChild(buildTip(
        `<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">${t("ai.providerClaudeTip")}</a>`
      ));
    }

    if (getProviderId() === "custom") {
      section.appendChild(buildCustomRow(
        t("ai.providerCustomUrl"),
        t("ai.providerCustomUrlPlaceholder"),
        getCustomBaseUrl(),
        (val) => setCustomBaseUrl(val)
      ));
    }

    if (needsCorsProxy()) {
      section.appendChild(buildCustomRow(
        t("ai.corsProxy"),
        t("ai.corsProxyPlaceholder"),
        getCorsProxy(),
        (val) => setCorsProxy(val)
      ));
      section.appendChild(buildTip(t("ai.corsProxyHint")));
    }

    $providerContainer.appendChild(section);
  }

  function buildTip(html) {
    const tip = el("div");
    Object.assign(tip.style, {
      marginTop: "var(--spacing-xs)",
      fontSize: "12px",
      color: "var(--color-text-secondary)",
      lineHeight: "1.5",
    });
    tip.innerHTML = html;
    const link = tip.querySelector("a");
    if (link) {
      link.style.color = "var(--color-primary)";
      link.style.textDecoration = "none";
    }
    return tip;
  }

  function buildCustomRow(labelText, placeholder, value, onChange) {
    const row = el("div");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      gap: "var(--spacing-sm)",
      marginTop: "var(--spacing-sm)",
    });
    const lbl = el("span");
    Object.assign(lbl.style, {
      fontSize: "12px",
      color: "var(--color-text-secondary)",
      whiteSpace: "nowrap",
      minWidth: "70px",
    });
    lbl.textContent = labelText;
    const input = el("input", "form-input");
    Object.assign(input.style, { flex: "1", width: "auto" });
    input.type = "text";
    input.placeholder = placeholder;
    input.value = value;
    input.addEventListener("change", () => onChange(input.value.trim()));
    row.appendChild(lbl);
    row.appendChild(input);
    return row;
  }

  // ── Model selector with auto-fetch dropdown ──

  function renderModelSelector(modelContainer) {
    modelContainer.innerHTML = "";
    const currentProvider = PROVIDERS[getProviderId()];
    const currentModel = getProviderId() === "custom" ? getCustomModel() : getModel();
    const hasKey = !!getApiKey();
    const hasModelsEndpoint = currentProvider.modelsEndpoint;

    function saveModel(val) {
      if (getProviderId() === "custom") {
        setCustomModel(val);
      } else {
        setModel(val);
      }
    }

    if (!hasKey || !hasModelsEndpoint) {
      const input = el("input", "form-input");
      input.type = "text";
      input.placeholder = currentProvider.defaultModel;
      input.value = currentModel;
      input.addEventListener("change", () => saveModel(input.value.trim()));
      modelContainer.appendChild(input);
      return;
    }

    const loadingMsg = el("span");
    Object.assign(loadingMsg.style, {
      fontSize: "12px",
      color: "var(--color-text-secondary)",
      fontStyle: "italic",
    });
    loadingMsg.textContent = t("ai.modelLoading");
    modelContainer.appendChild(loadingMsg);

    fetchAvailableModels(getApiKey()).then(models => {
      modelContainer.innerHTML = "";

      if (!models || models.length === 0) {
        const input = el("input", "form-input");
        input.type = "text";
        input.placeholder = currentProvider.defaultModel;
        input.value = currentModel;
        input.addEventListener("change", () => saveModel(input.value.trim()));
        modelContainer.appendChild(input);
        modelContainer.appendChild(buildTip(t("ai.modelFetchFail")));
        return;
      }

      const wrapper = el("div");
      Object.assign(wrapper.style, { display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" });

      const select = el("select", "form-select");
      const activeModel = currentModel || currentProvider.defaultModel;

      let hasActive = false;
      for (const m of models) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name || m.id;
        if (m.id === activeModel) {
          opt.selected = true;
          hasActive = true;
        }
        select.appendChild(opt);
      }

      const customOpt = document.createElement("option");
      customOpt.value = "__custom__";
      customOpt.textContent = t("ai.modelCustom");
      select.appendChild(customOpt);

      if (!hasActive && activeModel) {
        const extra = document.createElement("option");
        extra.value = activeModel;
        extra.textContent = activeModel;
        extra.selected = true;
        select.insertBefore(extra, customOpt);
      }

      const customInput = el("input", "form-input");
      customInput.type = "text";
      customInput.placeholder = currentProvider.defaultModel;
      customInput.style.display = "none";
      customInput.addEventListener("change", () => saveModel(customInput.value.trim()));

      select.addEventListener("change", () => {
        if (select.value === "__custom__") {
          customInput.style.display = "";
          customInput.focus();
        } else {
          customInput.style.display = "none";
          saveModel(select.value);
        }
      });

      wrapper.appendChild(select);
      wrapper.appendChild(customInput);
      modelContainer.appendChild(wrapper);
    });
  }

  function refreshModelSelector() {
    const mc = $keyContainer.querySelector("[data-role='model-container']");
    if (mc) renderModelSelector(mc);
  }

  // ── Key section ──

  function renderKeySection() {
    $keyContainer.innerHTML = "";
    const section = el("div");
    Object.assign(section.style, {
      padding: "var(--spacing-sm) var(--spacing-lg)",
      borderBottom: "var(--border-width) solid var(--border-color)",
      background: "var(--color-bg)",
    });
    const hasKey = !!getApiKey();
    prevApiKeySet = hasKey;

    if (hasKey) {
      const row = el("div");
      Object.assign(row.style, { display: "flex", alignItems: "center", gap: "var(--spacing-sm)", flexWrap: "wrap" });
      const status = el("span");
      Object.assign(status.style, { fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" });
      status.textContent = t("ai.keySet");
      const clearBtn = el("button", "btn btn-ghost btn-sm");
      clearBtn.textContent = t("ai.keyClear");
      clearBtn.addEventListener("click", () => {
        store.removeApiKey();
        clearModelCache();
        renderKeySection();
        refreshModelSelector();
      });
      row.appendChild(status);
      row.appendChild(clearBtn);
      section.appendChild(row);
    } else {
      const row = el("div");
      Object.assign(row.style, { display: "flex", alignItems: "center", gap: "var(--spacing-sm)", flexWrap: "wrap" });

      const input = el("input", "form-input");
      Object.assign(input.style, { flex: "1", minWidth: "250px", width: "auto" });
      input.type = "password";
      input.placeholder = t("ai.keyPlaceholder");
      input.autocomplete = "off";
      input.dataset.role = "key-input";
      input.setAttribute("data-1p-ignore", "");
      input.setAttribute("data-lpignore", "true");
      input.setAttribute("data-form-type", "other");

      const rememberLabel = el("label", "form-checkbox-group");
      Object.assign(rememberLabel.style, { cursor: "pointer", whiteSpace: "nowrap" });
      const rememberCheck = el("input");
      rememberCheck.type = "checkbox";
      rememberCheck.style.accentColor = "var(--color-primary)";
      rememberLabel.appendChild(rememberCheck);
      rememberLabel.appendChild(document.createTextNode(" " + t("ai.keyRemember")));

      const saveBtn = el("button", "btn btn-primary btn-sm");
      saveBtn.textContent = t("ai.keySave");

      const statusMsg = el("span");
      Object.assign(statusMsg.style, { fontSize: "12px", whiteSpace: "nowrap" });

      async function handleSaveKey() {
        const val = input.value.trim();
        if (!val) return;
        saveBtn.disabled = true;
        input.disabled = true;
        statusMsg.textContent = t("ai.keyVerifying");
        statusMsg.style.color = "var(--color-text-secondary)";
        statusMsg.style.fontStyle = "";

        const result = await validateApiKey(val);

        if (result.valid) {
          store.updateApiKey(val, rememberCheck.checked);
          renderKeySection();
          refreshModelSelector();
        } else if (result.error === "NETWORK_ERROR") {
          store.updateApiKey(val, rememberCheck.checked);
          statusMsg.textContent = t("ai.keyNetworkError");
          statusMsg.style.color = "var(--color-text-secondary)";
          statusMsg.style.fontStyle = "italic";
          setTimeout(() => { renderKeySection(); refreshModelSelector(); }, 1500);
        } else if (result.error && result.error.startsWith("QUOTA_EXCEEDED:")) {
          saveBtn.disabled = false;
          input.disabled = false;
          const apiDetail = result.error.slice("QUOTA_EXCEEDED:".length).trim();
          statusMsg.textContent = t("ai.error.quotaExceeded") + (apiDetail ? "\n(" + apiDetail + ")" : "");
          statusMsg.style.color = "var(--color-accent)";
          statusMsg.style.fontStyle = "";
        } else {
          saveBtn.disabled = false;
          input.disabled = false;
          statusMsg.textContent = t("ai.keyInvalid");
          statusMsg.style.color = "var(--color-accent)";
          statusMsg.style.fontStyle = "";
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
    }

    const modelRow = el("div");
    Object.assign(modelRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "var(--spacing-sm)",
      marginTop: "var(--spacing-sm)",
    });
    const modelLabel = el("span");
    Object.assign(modelLabel.style, {
      fontSize: "12px",
      color: "var(--color-text-secondary)",
      whiteSpace: "nowrap",
      minWidth: "70px",
    });
    modelLabel.textContent = t("ai.model");
    modelRow.appendChild(modelLabel);

    const modelContainer = el("div");
    modelContainer.dataset.role = "model-container";
    Object.assign(modelContainer.style, {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-xs)",
    });
    modelRow.appendChild(modelContainer);
    section.appendChild(modelRow);

    renderModelSelector(modelContainer);

    const notice = el("div");
    Object.assign(notice.style, {
      marginTop: "var(--spacing-xs)",
      padding: "var(--spacing-xs) 0",
      fontSize: "12px",
      lineHeight: "1.5",
      color: "var(--color-text-secondary)",
      opacity: "0.8",
    });
    notice.textContent = t("ai.securityNotice");
    section.appendChild(notice);

    $keyContainer.appendChild(section);
  }

  // ── Message bubble builder ──

  function applyBubbleStyle(bubble, role) {
    Object.assign(bubble.style, {
      maxWidth: "85%",
      padding: "var(--spacing-sm) var(--spacing)",
      borderRadius: "var(--border-radius)",
      fontSize: "var(--font-size-sm)",
      lineHeight: "var(--line-height)",
      wordBreak: "break-word",
    });
    if (role === "user") {
      Object.assign(bubble.style, {
        alignSelf: "flex-end",
        background: "var(--color-primary)",
        color: "#ffffff",
        borderBottomRightRadius: "4px",
      });
    } else {
      Object.assign(bubble.style, {
        alignSelf: "flex-start",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        border: "var(--border-width) solid var(--border-color)",
        borderBottomLeftRadius: "4px",
      });
    }
  }

  function buildMessageBubble(msg) {
    const bubble = el("div");
    applyBubbleStyle(bubble, msg.role);

    const text = el("div");
    text.style.marginBottom = "var(--spacing-xs)";
    text.textContent = msg.role === "user" ? msg.content : msg.explanation;
    bubble.appendChild(text);

    if (msg.role === "assistant" && msg.variables) {
      const varList = el("div");
      Object.assign(varList.style, {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        margin: "var(--spacing-sm) 0",
        padding: "var(--spacing-sm)",
        background: "var(--color-surface)",
        borderRadius: "calc(var(--border-radius) / 2)",
        border: "1px solid var(--border-color)",
        maxHeight: "200px",
        overflowY: "auto",
        fontSize: "12px",
        fontFamily: "'Courier Prime', monospace",
      });

      for (const [key, value] of Object.entries(msg.variables)) {
        const item = el("div");
        Object.assign(item.style, {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "2px 4px",
          borderRadius: "3px",
        });
        item.addEventListener("mouseenter", () => { item.style.background = "var(--color-bg)"; });
        item.addEventListener("mouseleave", () => { item.style.background = ""; });

        const nameEl = el("span");
        Object.assign(nameEl.style, { color: "var(--color-primary)", whiteSpace: "nowrap" });
        nameEl.textContent = key;

        const valueEl = el("span");
        Object.assign(valueEl.style, {
          color: "var(--color-text)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          textAlign: "right",
        });
        valueEl.textContent = value;

        if (key.includes("color") || key === "--shadow-color" || key === "--glow-color") {
          const swatch = el("span");
          Object.assign(swatch.style, {
            display: "inline-block",
            width: "14px",
            height: "14px",
            borderRadius: "3px",
            border: "1px solid var(--border-color)",
            verticalAlign: "middle",
            flexShrink: "0",
            backgroundColor: value,
          });
          valueEl.prepend(swatch);
        }

        item.appendChild(nameEl);
        item.appendChild(valueEl);
        varList.appendChild(item);
      }
      bubble.appendChild(varList);

      if (msg.rejected && msg.rejected.length > 0) {
        const rejectedEl = el("div");
        Object.assign(rejectedEl.style, {
          fontSize: "11px",
          color: "var(--color-accent)",
          marginTop: "var(--spacing-xs)",
          opacity: "0.8",
        });
        rejectedEl.textContent = t("ai.rejected") + ": " +
          msg.rejected.map(r => `${r.key} (${r.reason})`).join(", ");
        bubble.appendChild(rejectedEl);
      }

      const applyBtn = el("button", "btn btn-primary btn-sm");
      applyBtn.style.marginTop = "var(--spacing-sm)";
      applyBtn.textContent = msg.applied ? t("ai.applied") : t("ai.apply");
      if (msg.applied) {
        applyBtn.disabled = true;
        applyBtn.style.opacity = "0.6";
        applyBtn.style.cursor = "default";
      }
      applyBtn.addEventListener("click", () => {
        store.applyVariables(msg.id);
        applyBtn.textContent = t("ai.applied");
        applyBtn.disabled = true;
        applyBtn.style.opacity = "0.6";
        applyBtn.style.cursor = "default";
      });
      bubble.appendChild(applyBtn);
    }

    if (msg.role === "assistant" && msg.error) {
      const errorEl = el("div");
      Object.assign(errorEl.style, {
        color: "var(--color-accent)",
        fontSize: "var(--font-size-sm)",
        padding: "var(--spacing-xs) 0",
      });
      errorEl.textContent = msg.error;
      bubble.appendChild(errorEl);

      const retryBtn = el("button", "btn btn-ghost btn-sm");
      retryBtn.style.marginTop = "var(--spacing-sm)";
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
