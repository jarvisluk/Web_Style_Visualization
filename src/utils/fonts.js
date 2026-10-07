// Font stacks. Every Latin choice gets a Chinese fallback so CJK text never
// drops to the browser default (often SimSun on Windows).
// Sans: native system fonts first (PingFang / YaHei render best and need no
// download), the Noto Sans SC web font last for systems without either.
// Serif: the Noto Serif SC web font first — it reads far better on screen
// than the built-in Songti / SimSun.

export const CJK_SANS =
  "'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', sans-serif";
export const CJK_SERIF = "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif";

// Options for the tuning panel's font picker.
export const LATIN_FONTS = [
  { label: "Inter", value: `'Inter', ${CJK_SANS}` },
  { label: "Geist", value: `'Geist', ${CJK_SANS}` },
  { label: "Roboto", value: `'Roboto', 'Noto Sans SC', ${CJK_SANS}` },
  { label: "Newsreader", value: `'Newsreader', ${CJK_SERIF}` },
  { label: "Instrument Serif", value: `'Instrument Serif', ${CJK_SERIF}` },
  { label: "Courier Prime", value: `'Courier Prime', 'Noto Sans SC', ${CJK_SANS}` },
  { label: "Press Start 2P", value: `'Press Start 2P', 'Fusion Pixel SC', 'ZCOOL QingKe HuangYou', ${CJK_SANS}` },
  { label: "System UI", value: `system-ui, -apple-system, ${CJK_SANS}` },
];

export const CJK_FONTS = [
  { label: "Noto Sans SC", labelZh: "思源黑体", value: `'Noto Sans SC', ${CJK_SANS}` },
  { label: "Noto Serif SC", labelZh: "思源宋体", value: CJK_SERIF },
  { label: "PingFang / YaHei", labelZh: "苹方 / 微软雅黑", value: CJK_SANS },
  { label: "Fusion Pixel", labelZh: "缝合像素", value: `'Fusion Pixel SC', 'ZCOOL QingKe HuangYou', ${CJK_SANS}` },
  { label: "ZCOOL QingKe HuangYou", labelZh: "站酷庆科黄油体", value: `'ZCOOL QingKe HuangYou', ${CJK_SANS}` },
];

export const SYSTEM_FONTS = [
  { label: "Georgia", value: `Georgia, ${CJK_SERIF}` },
  { label: "Helvetica Neue", value: `'Helvetica Neue', Arial, ${CJK_SANS}` },
  { label: "Times New Roman", value: `'Times New Roman', Times, ${CJK_SERIF}` },
  { label: "Menlo", value: `Menlo, Monaco, 'Courier New', ${CJK_SANS}` },
];

/** First family in a font-family value, unquoted and lower-cased, for matching. */
export function primaryFamily(value) {
  return (value || "").split(",")[0].replace(/['"]/g, "").trim().toLowerCase();
}

/** Wrap a bare family name (detected or uploaded) with the Chinese fallback. */
export function withCJKFallback(family) {
  return `'${family.replace(/'/g, "")}', ${CJK_SANS}`;
}
