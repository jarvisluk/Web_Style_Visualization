const styleModules = import.meta.glob(["./*.json", "!./_*.json"], { eager: true });

export const STYLES = Object.fromEntries(
  Object.entries(styleModules)
    .map(([, mod]) => [mod.default.id, mod.default])
);

export const STYLE_LIST = Object.values(STYLES);

export const CATEGORIES = {
  classic: "经典基础",
  modern: "现代流行",
  theme: "主题氛围"
};
