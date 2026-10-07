import { CATEGORIES } from "../styles/index.js";

const translations = {
  en: {
    "app.tagline": "Design style studio",
    "top.share": "Copy link",
    "top.shared": "Link copied",
    "top.theme": "Toggle interface theme",
    "top.lang": "中文",
    "top.inspector": "Open inspector",
    "rail.title": "Styles",
    "rail.count": "presets",
    "stage.desktop": "Desktop",
    "stage.tablet": "Tablet",
    "stage.mobile": "Mobile",
    "inspector.tune": "Tune",
    "inspector.code": "Code",
    "inspector.agent": "Agent",
    "inspector.reset": "Reset",
    "inspector.modified": "modified",
    "demo.nav.product": "Product",
    "demo.nav.pricing": "Pricing",
    "demo.nav.docs": "Docs",
    "demo.nav.signin": "Sign in",
    "demo.eyebrow": "Now previewing",
    "demo.start": "Get started",
    "demo.learn": "Learn more",
    "demo.stats.title": "Overview",
    "demo.stats.period": "Last 30 days",
    "demo.stats.visitors": "Visitors",
    "demo.stats.conversion": "Conversion",
    "demo.stats.revenue": "Revenue",
    "demo.stats.latency": "Latency",
    "demo.key.title": "What defines it",
    "demo.key.empty": "Custom variables — no notes for this style.",
    "demo.form.title": "Join the beta",
    "demo.form.desc": "Get early access to new styles.",
    "demo.form.email": "Email",
    "demo.form.role": "Role",
    "demo.form.roles": "Designer|Frontend developer|Product manager",
    "demo.form.updates": "Send me product updates",
    "demo.form.submit": "Request access",
    "demo.ui.title": "Components",
    "demo.ui.primary": "Primary",
    "demo.ui.secondary": "Secondary",
    "demo.ui.accent": "Accent",
    "demo.ui.ghost": "Ghost",
    "demo.ui.disabled": "Disabled",
    "demo.ui.new": "New",
    "demo.ui.beta": "Beta",
    "demo.ui.stable": "Stable",
    "demo.ui.progress": "Storage used",
    "demo.ui.alert": "Your export is ready to download.",
    "cards.c1.title": "Color system",
    "cards.c1.text": "Every style defines its own palette. Switch the whole page's color language in one click.",
    "cards.c2.title": "Shape language",
    "cards.c2.text": "Radii, borders and shadows form the shape language. Tune each one and watch it ripple.",
    "cards.c3.title": "Signature effects",
    "cards.c3.text": "Glass blur, neon glow, hard shadows — the details that make a style recognisable.",
    "cards.learn": "Learn more",
    "tuning.colors": "Colors",
    "tuning.shape": "Shape",
    "tuning.shadow": "Shadow",
    "tuning.typography": "Typography",
    "tuning.spacing": "Spacing",
    "tuning.special": "Signature",
    "tuning.primary": "Primary",
    "tuning.background": "Background",
    "tuning.surface": "Surface",
    "tuning.text": "Text",
    "tuning.accent": "Accent",
    "tuning.borderRadius": "Radius",
    "tuning.borderWidth": "Border width",
    "tuning.borderColor": "Border color",
    "tuning.offsetX": "Offset X",
    "tuning.offsetY": "Offset Y",
    "tuning.blur": "Blur",
    "tuning.shadowColor": "Shadow color",
    "tuning.fontFamily": "Font family",
    "tuning.fontWeight": "Font weight",
    "tuning.baseSpacing": "Base spacing",
    "tuning.uploadFont": "Upload font",
    "tuning.detectFonts": "Detect system fonts",
    "tuning.detecting": "Detecting…",
    "tuning.detected": "fonts detected",
    "tuning.notSupported": "Not supported in this browser",
    "tuning.fontLoaded": "Loaded:",
    "tuning.fontFailed": "Failed to load font",
    "tuning.googleFonts": "Latin fonts",
    "tuning.systemFonts": "System fonts",
    "tuning.cjkFonts": "Chinese fonts",
    "tuning.customFont": "Uploaded",
    "code.title": "CSS variables",
    "code.copy": "Copy",
    "code.copied": "Copied",
    "code.download": "Download",
    "code.hint": "Paste into your stylesheet. Components read these variables.",
    "agent.status.on": "WebMCP active",
    "agent.status.off": "WebMCP not available",
    "agent.status.onDesc": "This page registered its tools with your browser. An in-browser agent can call them directly.",
    "agent.status.offDesc": "Your browser doesn't expose document.modelContext yet. Agents can still drive the page through window.WebStyleAPI or URL parameters.",
    "agent.tools": "Tools",
    "agent.other": "Other ways in",
    "agent.console": "Browser automation",
    "agent.url": "URL parameters",
    "agent.skill": "Agent Skill",
    "agent.skillDesc": "Install web-style-skill/ into Claude Code, Codex or Cursor to let coding agents generate styles offline.",
    "custom.title": "Custom CSS variables",
    "custom.name": "Custom",
    "custom.desc": "Paste or upload",
    "custom.hint": "Paste CSS variables or upload a .css file. Example: <code>--color-primary: #6366f1;</code>",
    "custom.upload": "Upload .css",
    "custom.apply": "Apply",
    "custom.cancel": "Cancel",
    "custom.invalid": "No supported CSS variables found. Use the --variable: value; format.",
  },
  zh: {
    "app.tagline": "设计风格工作台",
    "top.share": "复制链接",
    "top.shared": "已复制链接",
    "top.theme": "切换界面主题",
    "top.lang": "EN",
    "top.inspector": "打开检查器",
    "rail.title": "风格",
    "rail.count": "个预设",
    "stage.desktop": "桌面",
    "stage.tablet": "平板",
    "stage.mobile": "手机",
    "inspector.tune": "调参",
    "inspector.code": "代码",
    "inspector.agent": "Agent",
    "inspector.reset": "重置",
    "inspector.modified": "项已修改",
    "demo.nav.product": "产品",
    "demo.nav.pricing": "定价",
    "demo.nav.docs": "文档",
    "demo.nav.signin": "登录",
    "demo.eyebrow": "正在预览",
    "demo.start": "开始使用",
    "demo.learn": "了解更多",
    "demo.stats.title": "概览",
    "demo.stats.period": "近 30 天",
    "demo.stats.visitors": "访客",
    "demo.stats.conversion": "转化率",
    "demo.stats.revenue": "收入",
    "demo.stats.latency": "延迟",
    "demo.key.title": "风格要点",
    "demo.key.empty": "自定义变量，暂无风格说明。",
    "demo.form.title": "加入内测",
    "demo.form.desc": "抢先体验新风格。",
    "demo.form.email": "邮箱",
    "demo.form.role": "角色",
    "demo.form.roles": "设计师|前端开发|产品经理",
    "demo.form.updates": "接收产品更新",
    "demo.form.submit": "申请资格",
    "demo.ui.title": "组件",
    "demo.ui.primary": "主要",
    "demo.ui.secondary": "次要",
    "demo.ui.accent": "强调",
    "demo.ui.ghost": "幽灵",
    "demo.ui.disabled": "禁用",
    "demo.ui.new": "新",
    "demo.ui.beta": "测试版",
    "demo.ui.stable": "稳定",
    "demo.ui.progress": "存储用量",
    "demo.ui.alert": "导出已完成，可以下载了。",
    "cards.c1.title": "色彩系统",
    "cards.c1.text": "每种风格都有自己的配色，一键切换整页的色彩语言。",
    "cards.c2.title": "形状语言",
    "cards.c2.text": "圆角、边框与阴影构成形状语言，逐项微调，实时看到变化。",
    "cards.c3.title": "标志性效果",
    "cards.c3.text": "毛玻璃、霓虹光晕、硬阴影——让一种风格被一眼认出的细节。",
    "cards.learn": "了解更多",
    "tuning.colors": "颜色",
    "tuning.shape": "形状",
    "tuning.shadow": "阴影",
    "tuning.typography": "字体",
    "tuning.spacing": "间距",
    "tuning.special": "专属参数",
    "tuning.primary": "主色",
    "tuning.background": "背景",
    "tuning.surface": "表面",
    "tuning.text": "文本",
    "tuning.accent": "强调",
    "tuning.borderRadius": "圆角",
    "tuning.borderWidth": "边框宽度",
    "tuning.borderColor": "边框颜色",
    "tuning.offsetX": "X 偏移",
    "tuning.offsetY": "Y 偏移",
    "tuning.blur": "模糊",
    "tuning.shadowColor": "阴影颜色",
    "tuning.fontFamily": "字体",
    "tuning.fontWeight": "字重",
    "tuning.baseSpacing": "基础间距",
    "tuning.uploadFont": "上传字体",
    "tuning.detectFonts": "检测系统字体",
    "tuning.detecting": "检测中…",
    "tuning.detected": "个字体",
    "tuning.notSupported": "当前浏览器不支持",
    "tuning.fontLoaded": "已加载：",
    "tuning.fontFailed": "字体加载失败",
    "tuning.googleFonts": "西文字体",
    "tuning.systemFonts": "系统字体",
    "tuning.cjkFonts": "中文字体",
    "tuning.customFont": "已上传",
    "code.title": "CSS 变量",
    "code.copy": "复制",
    "code.copied": "已复制",
    "code.download": "下载",
    "code.hint": "粘贴到你的样式表即可，组件都读取这些变量。",
    "agent.status.on": "WebMCP 已启用",
    "agent.status.off": "WebMCP 不可用",
    "agent.status.onDesc": "本页已向浏览器注册工具，浏览器内的 Agent 可以直接调用。",
    "agent.status.offDesc": "当前浏览器尚未提供 document.modelContext。Agent 仍可通过 window.WebStyleAPI 或 URL 参数操作本页。",
    "agent.tools": "工具",
    "agent.other": "其他接入方式",
    "agent.console": "浏览器自动化",
    "agent.url": "URL 参数",
    "agent.skill": "Agent Skill",
    "agent.skillDesc": "把 web-style-skill/ 安装到 Claude Code、Codex 或 Cursor，编程 Agent 就能离线生成风格。",
    "custom.title": "自定义 CSS 变量",
    "custom.name": "自定义",
    "custom.desc": "粘贴或上传",
    "custom.hint": "粘贴 CSS 变量或上传 .css 文件。示例：<code>--color-primary: #6366f1;</code>",
    "custom.upload": "上传 .css",
    "custom.apply": "应用",
    "custom.cancel": "取消",
    "custom.invalid": "没有找到支持的 CSS 变量，请使用 --variable: value; 格式。",
  },
};

function readStoredLang() {
  try {
    return localStorage.getItem("i18n_lang");
  } catch {
    return null;
  }
}

let currentLang = readStoredLang() || (navigator.language?.startsWith("zh") ? "zh" : "en");
let listeners = [];
document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "zh") return;
  currentLang = lang;
  try {
    localStorage.setItem("i18n_lang", lang);
  } catch {
    // Storage unavailable; language still applies for this session.
  }
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  notifyListeners();
}

export function toggleLang() {
  setLang(currentLang === "zh" ? "en" : "zh");
}

export function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

export function getStyleName(style) {
  return currentLang === "zh" && style.nameZh ? style.nameZh : style.name;
}

export function getStyleDesc(style) {
  return currentLang === "zh" && style.descriptionZh ? style.descriptionZh : style.description;
}

export function getCategoryName(categoryId) {
  if (currentLang === "en") {
    const enMap = { classic: "Classic", modern: "Modern", theme: "Theme", custom: "Custom" };
    return enMap[categoryId] || categoryId;
  }
  return CATEGORIES[categoryId] || (categoryId === "custom" ? "自定义" : categoryId);
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
