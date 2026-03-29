import { STYLES, CATEGORIES } from "../styles/index.js";

const translations = {
  en: {
    "nav.preview": "Preview",
    "nav.components": "Components",
    "nav.github": "GitHub",
    "nav.lang": "中/EN",
    "hero.start": "Get Started",
    "hero.learn": "Learn More",
    "panel.tuning": "⚙️ Fine Tuning",
    "tuning.reset": "Reset",
    "tuning.colors": "🎨 Colors",
    "tuning.shape": "📐 Shape",
    "tuning.shadow": "🌑 Shadow",
    "tuning.typography": "🔤 Typography",
    "tuning.spacing": "📏 Spacing",
    "tuning.special": "✨ Special",
    "tuning.primary": "Primary",
    "tuning.background": "Background",
    "tuning.surface": "Surface",
    "tuning.text": "Text",
    "tuning.accent": "Accent",
    "tuning.borderRadius": "Border Radius",
    "tuning.borderWidth": "Border Width",
    "tuning.borderColor": "Border Color",
    "tuning.offsetX": "Offset X",
    "tuning.offsetY": "Offset Y",
    "tuning.blur": "Blur",
    "tuning.shadowColor": "Shadow Color",
    "tuning.fontFamily": "Font Family",
    "tuning.fontWeight": "Font Weight",
    "tuning.baseSpacing": "Base Spacing",
    "tuning.uploadFont": "Upload Font",
    "tuning.detectFonts": "Detect System Fonts",
    "tuning.detecting": "Detecting...",
    "tuning.detected": "fonts detected",
    "tuning.notSupported": "Not supported in this browser",
    "tuning.fontLoaded": "Loaded:",
    "tuning.googleFonts": "Google Fonts",
    "tuning.systemFonts": "System Fonts",
    "tuning.customFont": "Custom Upload",
    "code.title": "CSS Variables Output",
    "code.copy": "Copy",
    "code.copied": "Copied!",
    "code.download": "Download",
    "selector.title": "Select Style",
    "custom.title": "Upload Custom CSS Variables",
    "custom.name": "＋ Custom",
    "custom.hint": "Paste CSS Variables code or upload a .css file.<br>Example: <code>--color-primary: #6366f1;</code>",
    "custom.upload": "Upload .css file",
    "custom.apply": "Apply",
    "custom.cancel": "Cancel",
    "cards.c1.title": "Color System",
    "cards.c1.text": "Every style defines a unique color palette. Switch the entire site's color language with one click.",
    "cards.c2.title": "Shape Language",
    "cards.c2.text": "Border radii, borders, and shadows form the shape language. The tuning panel helps you understand every parameter.",
    "cards.c3.title": "Special Effects",
    "cards.c3.text": "Glass blur, neon glow, hard shadows — distinct effects are key factors in differentiating styles.",
    "cards.learn": "Learn More",
    "ai.title": "AI Style Generator",
    "ai.placeholder": "Describe the website style you want, and AI will generate it for you.",
    "ai.inputPlaceholder": "e.g. A cyberpunk style with neon purple and dark background...",
    "ai.send": "Generate",
    "ai.randomTip": "Random style prompt",
    "ai.randomLocal": "Quick Random",
    "ai.randomAI": "AI Generate",
    "ai.randomAIGenerating": "Generating...",
    "ai.randomAIError": "Generation failed, using local random",
    "ai.apply": "Apply Style",
    "ai.applied": "Applied",
    "ai.rejected": "Rejected variables",
    "ai.provider": "API Provider",
    "ai.providerCustomUrl": "API Base URL",
    "ai.providerCustomUrlPlaceholder": "https://your-api.com/v1",
    "ai.providerCustomModel": "Model Name",
    "ai.providerCustomModelPlaceholder": "gpt-4o-mini",
    "ai.providerOpenCodeZenTip": "Get your key at opencode.ai/auth",
    "ai.providerGeminiTip": "Get your API key at Google AI Studio",
    "ai.providerClaudeTip": "Get your API key at the Anthropic Console",
    "ai.corsProxy": "CORS Proxy",
    "ai.corsProxyPlaceholder": "https://your-cors-proxy.com",
    "ai.corsProxyHint": "This provider doesn't support browser CORS. Set up a CORS proxy (<a href=\"https://github.com/Rob--W/cors-anywhere\" target=\"_blank\">self-hosted</a> or <code>https://corsproxy.io</code>) to use it from the browser.",
    "ai.keyPlaceholder": "Enter your API Key",
    "ai.keySave": "Save",
    "ai.keyVerifying": "Verifying...",
    "ai.keyValid": "API Key verified",
    "ai.keyInvalid": "Invalid API Key, please check and re-enter.",
    "ai.keyNetworkError": "Network error, key saved but not verified.",
    "ai.keyClear": "Clear Key",
    "ai.keySet": "API Key configured",
    "ai.keyRemember": "Remember on this device",
    "ai.securityNotice": "Your API key is stored only in this browser and never sent to any third-party server. API calls go directly to the selected provider. This project is open-source — you can verify the code.",
    "ai.error.noKey": "Please enter your API Key first.",
    "ai.error.invalidKey": "Invalid API Key. Please check and try again.",
    "ai.error.rateLimit": "Rate limited. Please wait a moment and try again.",
    "ai.error.serverError": "Server error. Please try again later.",
    "ai.error.generic": "Request failed. Please check your network and try again.",
    "ai.error.network": "Network error — could not reach the API. If using a non-OpenAI provider, try configuring a CORS proxy above.",
    "ai.error.responseFormat": "The API returned a non-JSON response. The provider may not be compatible.",
    "ai.error.emptyResponse": "The API returned an empty response. The model may be unavailable.",
    "ai.error.parse": "Failed to parse AI response. The model may have returned unexpected output.",
    "ai.error.noBaseUrl": "Please configure the API base URL first.",
    "ai.model": "Model",
    "ai.stop": "Stop",
    "ai.retry": "Retry",
    "ai.streaming": "Generating...",
  },
  zh: {
    "nav.preview": "预览",
    "nav.components": "组件",
    "nav.github": "源码",
    "nav.lang": "EN/中",
    "hero.start": "开始使用",
    "hero.learn": "了解更多",
    "panel.tuning": "⚙️ 参数微调",
    "tuning.reset": "重置",
    "tuning.colors": "🎨 颜色系统",
    "tuning.shape": "📐 形状语言",
    "tuning.shadow": "🌑 阴影系统",
    "tuning.typography": "🔤 字体排版",
    "tuning.spacing": "📏 基础间距",
    "tuning.special": "✨ 专属特色",
    "tuning.primary": "主色",
    "tuning.background": "背景色",
    "tuning.surface": "表面色",
    "tuning.text": "文本色",
    "tuning.accent": "强调色",
    "tuning.borderRadius": "圆角大小",
    "tuning.borderWidth": "边框宽度",
    "tuning.borderColor": "边框颜色",
    "tuning.offsetX": "X 轴偏移",
    "tuning.offsetY": "Y 轴偏移",
    "tuning.blur": "模糊半径",
    "tuning.shadowColor": "阴影颜色",
    "tuning.fontFamily": "首选字体",
    "tuning.fontWeight": "字体粗细",
    "tuning.baseSpacing": "基础间距",
    "tuning.uploadFont": "上传字体",
    "tuning.detectFonts": "检测系统字体",
    "tuning.detecting": "检测中...",
    "tuning.detected": "个字体已检测",
    "tuning.notSupported": "当前浏览器不支持",
    "tuning.fontLoaded": "已加载：",
    "tuning.googleFonts": "谷歌字体",
    "tuning.systemFonts": "系统字体",
    "tuning.customFont": "自定义上传",
    "code.title": "CSS 变量输出",
    "code.copy": "复制",
    "code.copied": "已复制!",
    "code.download": "下载 .css",
    "selector.title": "选择风格",
    "custom.title": "上传自定义 CSS 变量",
    "custom.name": "＋ 自定义",
    "custom.hint": "粘贴包含 CSS Variables 的代码，或上传 .css 文件。<br>格式示例：<code>--color-primary: #6366f1;</code>",
    "custom.upload": "上传 .css 文件",
    "custom.apply": "应用",
    "custom.cancel": "取消",
    "cards.c1.title": "色彩系统",
    "cards.c1.text": "每种风格定义独特的配色方案，从主色到强调色，一键切换整站色彩语言。",
    "cards.c2.title": "形状语言",
    "cards.c2.text": "圆角、边框、阴影共同构成风格的形状语言，微调面板让你深入理解每个参数。",
    "cards.c3.title": "专属特效",
    "cards.c3.text": "毛玻璃模糊、霓虹发光、硬阴影 — 独特效果是区分风格的关键因素。",
    "cards.learn": "了解更多",
    "ai.title": "AI 风格生成器",
    "ai.placeholder": "描述你想要的网站风格，AI 将为你生成对应的样式。",
    "ai.inputPlaceholder": "例如：赛博朋克风格，霓虹紫色，深色背景...",
    "ai.send": "生成",
    "ai.randomTip": "随机风格提示词",
    "ai.randomLocal": "快速随机",
    "ai.randomAI": "AI 生成",
    "ai.randomAIGenerating": "生成中...",
    "ai.randomAIError": "生成失败，使用本地随机",
    "ai.apply": "应用风格",
    "ai.applied": "已应用",
    "ai.rejected": "被拒绝的变量",
    "ai.provider": "API 提供商",
    "ai.providerCustomUrl": "API 基础地址",
    "ai.providerCustomUrlPlaceholder": "https://your-api.com/v1",
    "ai.providerCustomModel": "模型名称",
    "ai.providerCustomModelPlaceholder": "gpt-4o-mini",
    "ai.providerOpenCodeZenTip": "在 opencode.ai/auth 获取密钥",
    "ai.providerGeminiTip": "在 Google AI Studio 获取 API 密钥",
    "ai.providerClaudeTip": "在 Anthropic Console 获取 API 密钥",
    "ai.corsProxy": "CORS 代理",
    "ai.corsProxyPlaceholder": "https://your-cors-proxy.com",
    "ai.corsProxyHint": "该提供商不支持浏览器跨域请求，需配置 CORS 代理（<a href=\"https://github.com/Rob--W/cors-anywhere\" target=\"_blank\">自建</a> 或 <code>https://corsproxy.io</code>）才能在浏览器中使用。",
    "ai.keyPlaceholder": "输入你的 API Key",
    "ai.keySave": "保存",
    "ai.keyVerifying": "验证中...",
    "ai.keyValid": "API Key 验证通过",
    "ai.keyInvalid": "API Key 无效，请检查后重新输入。",
    "ai.keyNetworkError": "网络错误，Key 已保存但未验证。",
    "ai.keyClear": "清除 Key",
    "ai.keySet": "API Key 已配置",
    "ai.keyRemember": "在此设备上记住",
    "ai.securityNotice": "你的 API Key 仅保存在当前浏览器中，不会发送到任何第三方服务器。API 请求直接发送至所选提供商。本项目完全开源，你可以审查代码。",
    "ai.error.noKey": "请先输入你的 API Key。",
    "ai.error.invalidKey": "API Key 无效，请检查后重试。",
    "ai.error.rateLimit": "已被限流，请稍等片刻再试。",
    "ai.error.serverError": "服务器错误，请稍后重试。",
    "ai.error.generic": "请求失败，请检查网络后重试。",
    "ai.error.network": "网络错误 — 无法连接到 API。如使用非 OpenAI 提供商，请在上方配置 CORS 代理。",
    "ai.error.responseFormat": "API 返回了非 JSON 响应，该提供商可能不兼容。",
    "ai.error.emptyResponse": "API 返回了空响应，模型可能不可用。",
    "ai.error.parse": "AI 响应解析失败，模型可能返回了非预期的输出格式。",
    "ai.error.noBaseUrl": "请先配置 API 基础地址。",
    "ai.model": "模型",
    "ai.stop": "停止",
    "ai.retry": "重试",
    "ai.streaming": "生成中...",
  }
};

let currentLang = localStorage.getItem("i18n_lang") || "en";
let listeners = [];

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "zh") return;
  currentLang = lang;
  localStorage.setItem("i18n_lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  notifyListeners();
}

export function toggleLang() {
  setLang(currentLang === "zh" ? "en" : "zh");
}

export function t(key) {
  return translations[currentLang][key] || key;
}

export function getStyleName(style) {
  return currentLang === "zh" && style.nameZh ? style.nameZh : style.name;
}

export function getStyleDesc(style) {
  return currentLang === "zh" && style.descriptionZh ? style.descriptionZh : style.description;
}

export function getCategoryName(categoryId) {
  if (currentLang === "en") {
    const enMap = {
      "classic": "Classic",
      "modern": "Modern",
      "theme": "Theme",
      "custom": "Upload CSS"
    };
    return enMap[categoryId] || categoryId;
  }
  return CATEGORIES[categoryId] || categoryId;
}

export function onLangChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(currentLang));
}
