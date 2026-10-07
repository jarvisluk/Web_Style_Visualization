import { setVariable as setStyleVariable, getCurrentStyle, getCurrentVariables, getComputedVariable, onChange } from "../utils/css-var-manager.js";
import { t, getLang, getStyleName, onLangChange } from "../utils/i18n.js";
import { LATIN_FONTS, CJK_FONTS, SYSTEM_FONTS, primaryFamily, withCJKFallback } from "../utils/fonts.js";

// Edits made from this panel must not rebuild it mid-drag; external changes
// (preset switch, reset, agent calls) should.
let editingFromPanel = false;
function setVariable(name, value) {
  editingFromPanel = true;
  try {
    setStyleVariable(name, value);
  } finally {
    editingFromPanel = false;
  }
}

// --- Font state (persists across panel re-renders) ---
let cachedSystemFonts = null;   // null = not yet detected
let customFontName = null;      // name of user-uploaded font
let customFontValue = null;     // CSS value for --font-family

// --- System font detection ---
async function detectSystemFonts() {
  if (!window.queryLocalFonts) return null;
  try {
    const fonts = await window.queryLocalFonts();
    const families = [...new Set(fonts.map((f) => f.family))];
    return families.sort((a, b) => a.localeCompare(b));
  } catch {
    return null;
  }
}

function getCommonTuning() {
  return [
    { section: t("tuning.colors"), controls: [
      { variable: "--color-primary", label: t("tuning.primary"), type: "color" },
      { variable: "--color-bg", label: t("tuning.background"), type: "color" },
      { variable: "--color-surface", label: t("tuning.surface"), type: "color" },
      { variable: "--color-text", label: t("tuning.text"), type: "color" },
      { variable: "--color-accent", label: t("tuning.accent"), type: "color" },
    ]},
    { section: t("tuning.shape"), controls: [
      { variable: "--border-radius", label: t("tuning.borderRadius"), type: "range", min: 0, max: 32, step: 1, unit: "px" },
      { variable: "--border-width", label: t("tuning.borderWidth"), type: "range", min: 0, max: 6, step: 1, unit: "px" },
      { variable: "--border-color", label: t("tuning.borderColor"), type: "color" },
    ]},
    { section: t("tuning.shadow"), controls: [
      { variable: "--shadow-x", label: t("tuning.offsetX"), type: "range", min: -20, max: 20, step: 1, unit: "px" },
      { variable: "--shadow-y", label: t("tuning.offsetY"), type: "range", min: -20, max: 20, step: 1, unit: "px" },
      { variable: "--shadow-blur", label: t("tuning.blur"), type: "range", min: 0, max: 40, step: 1, unit: "px" },
      { variable: "--shadow-color", label: t("tuning.shadowColor"), type: "color" },
    ]},
    { section: t("tuning.typography"), controls: [
      { variable: "--font-family", label: t("tuning.fontFamily"), type: "font-picker" },
      { variable: "--font-weight", label: t("tuning.fontWeight"), type: "range", min: 100, max: 900, step: 100, unit: "" },
    ]},
    { section: t("tuning.spacing"), controls: [
      { variable: "--spacing", label: t("tuning.baseSpacing"), type: "range", min: 4, max: 32, step: 2, unit: "px" },
    ]},
  ];
}

let panelContainer = null;

export function renderTuningPanel(container) {
  panelContainer = container;
  const render = () => buildPanel();
  render();
  onChange(() => {
    if (!editingFromPanel) render();
  });
  onLangChange(render);
}

function buildPanel() {
  if (!panelContainer) return;

  const style = getCurrentStyle();
  const vars = getCurrentVariables();

  panelContainer.innerHTML = "";

  // Style-specific controls first: they are what makes the style distinct.
  if (style && style.specialTuning && style.specialTuning.length > 0) {
    const specialTitle = `${t("tuning.special")} · ${getStyleName(style)}`;
    renderSection(panelContainer, specialTitle, style.specialTuning, vars, true);
  }

  getCommonTuning().forEach((section) => {
    renderSection(panelContainer, section.section, section.controls, vars);
  });
}

// --- Build the <select> with optgroups ---
function buildFontSelect(currentValue) {
  const select = document.createElement("select");
  select.className = "tuning-select tuning-font-select";
  const current = primaryFamily(currentValue);
  const zh = getLang() === "zh";
  let matched = false;

  const addGroup = (label, fonts) => {
    if (!fonts.length) return;
    const group = document.createElement("optgroup");
    group.label = label;
    fonts.forEach((font) => {
      const opt = document.createElement("option");
      opt.value = font.value;
      opt.textContent = zh && font.labelZh ? `${font.labelZh} · ${font.label}` : font.label;
      opt.style.fontFamily = font.value;
      if (!matched && primaryFamily(font.value) === current) {
        opt.selected = true;
        matched = true;
      }
      group.appendChild(opt);
    });
    select.appendChild(group);
  };

  const systemFonts = cachedSystemFonts
    ? cachedSystemFonts.map((family) => ({ label: family, value: withCJKFallback(family) }))
    : SYSTEM_FONTS;
  const uploaded = customFontName && customFontValue ? [{ label: customFontName, value: customFontValue }] : [];

  // Chinese readers see Chinese faces first.
  const groups = [
    [t("tuning.googleFonts"), LATIN_FONTS],
    [t("tuning.cjkFonts"), CJK_FONTS],
  ];
  if (zh) groups.reverse();
  groups.forEach(([label, fonts]) => addGroup(label, fonts));
  addGroup(t("tuning.systemFonts"), systemFonts);
  addGroup(t("tuning.customFont"), uploaded);

  // Preset stacks that aren't in the list still show up as the selection.
  if (!matched && currentValue) {
    const opt = document.createElement("option");
    opt.value = currentValue;
    opt.textContent = currentValue.split(",")[0].replace(/['"]/g, "").trim();
    opt.selected = true;
    select.prepend(opt);
  }

  return select;
}

function renderSection(parent, title, controls, vars, highlight = false) {
  const section = document.createElement("div");
  section.className = highlight ? "tuning-section tuning-section-special" : "tuning-section";

  const titleEl = document.createElement("div");
  titleEl.className = "tuning-section-title";
  titleEl.textContent = title;
  section.appendChild(titleEl);

  controls.forEach((ctrl) => {
    const row = document.createElement("div");
    row.className = "tuning-row";

    const currentValue = vars[ctrl.variable] || getComputedVariable(ctrl.variable) || "";
    const lang = getLang();
    const labelText = (lang === "zh" && ctrl.labelZh) ? ctrl.labelZh : ctrl.label;

    if (ctrl.type === "color") {
      const hexValue = toHexSafe(currentValue);
      row.innerHTML = `
        <div class="tuning-label">
          <span>${labelText}</span>
          <span class="tuning-value">${currentValue}</span>
        </div>
        <input type="color" class="tuning-color-input" value="${hexValue}" />
      `;
      const input = row.querySelector("input");
      input.addEventListener("input", (e) => {
        setVariable(ctrl.variable, e.target.value);
        row.querySelector(".tuning-value").textContent = e.target.value;
      });
    } else if (ctrl.type === "range") {
      const parsed = parseFloat(currentValue);
      const numVal = Number.isFinite(parsed) ? parsed : Math.max(ctrl.min ?? 0, 0);
      row.innerHTML = `
        <div class="tuning-label">
          <span>${labelText}</span>
          <span class="tuning-value">${numVal}${ctrl.unit || ""}</span>
        </div>
        <input type="range" class="tuning-slider"
          min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step || 1}" value="${numVal}" />
      `;
      const input = row.querySelector("input");
      input.addEventListener("input", (e) => {
        const val = `${e.target.value}${ctrl.unit || ""}`;
        setVariable(ctrl.variable, val);
        row.querySelector(".tuning-value").textContent = val;
      });
    } else if (ctrl.type === "select") {
      const options = ctrl.options || [];
      row.innerHTML = `
        <div class="tuning-label">
          <span>${labelText}</span>
        </div>
        <select class="tuning-select">
          ${options.map((opt) => `<option value="${opt}" ${currentValue.includes(opt.split(",")[0].replace(/'/g, "")) ? "selected" : ""}>${opt}</option>`).join("")}
        </select>
      `;
      const select = row.querySelector("select");
      select.addEventListener("change", (e) => {
        setVariable(ctrl.variable, e.target.value);
      });
    } else if (ctrl.type === "font-picker") {
      // --- Font Picker: select + detect btn + upload btn ---
      row.innerHTML = `<div class="tuning-label"><span>${labelText}</span></div>`;

      // Font select with optgroups
      const select = buildFontSelect(currentValue);
      row.appendChild(select);
      select.addEventListener("change", (e) => {
        setVariable(ctrl.variable, e.target.value);
      });

      // Action buttons row
      const actionsRow = document.createElement("div");
      actionsRow.className = "tuning-font-actions";

      // Detect system fonts button
      const detectBtn = document.createElement("button");
      detectBtn.className = "tuning-font-btn";
      detectBtn.textContent = cachedSystemFonts ? `${cachedSystemFonts.length} ${t("tuning.detected")}` : t("tuning.detectFonts");
      if (!window.queryLocalFonts) {
        detectBtn.title = t("tuning.notSupported");
        detectBtn.style.opacity = "0.5";
      }
      detectBtn.addEventListener("click", async () => {
        if (!window.queryLocalFonts) {
          detectBtn.textContent = t("tuning.notSupported");
          setTimeout(() => {
            detectBtn.textContent = t("tuning.detectFonts");
          }, 2000);
          return;
        }
        detectBtn.textContent = t("tuning.detecting");
        detectBtn.disabled = true;
        const fonts = await detectSystemFonts();
        if (fonts && fonts.length > 0) {
          cachedSystemFonts = fonts;
          detectBtn.textContent = `${fonts.length} ${t("tuning.detected")}`;
          // Rebuild the select with newly detected fonts
          const newSelect = buildFontSelect(vars[ctrl.variable] || "");
          row.replaceChild(newSelect, row.querySelector("select"));
          newSelect.addEventListener("change", (e) => {
            setVariable(ctrl.variable, e.target.value);
          });
        } else {
          detectBtn.textContent = t("tuning.notSupported");
        }
        detectBtn.disabled = false;
      });
      actionsRow.appendChild(detectBtn);

      // Upload font button
      const uploadBtn = document.createElement("button");
      uploadBtn.className = "tuning-font-btn";
      uploadBtn.textContent = t("tuning.uploadFont");
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".ttf,.otf,.woff,.woff2";
      fileInput.style.display = "none";
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const buffer = await file.arrayBuffer();
          const fontName = file.name.replace(/\.(ttf|otf|woff2?)/i, "");
          const face = new FontFace(fontName, buffer);
          await face.load();
          document.fonts.add(face);

          customFontName = fontName;
          customFontValue = withCJKFallback(fontName);
          setVariable(ctrl.variable, customFontValue);

          // Rebuild select to include the custom font
          const newSelect = buildFontSelect(customFontValue);
          row.replaceChild(newSelect, row.querySelector("select"));
          newSelect.addEventListener("change", (ev) => {
            setVariable(ctrl.variable, ev.target.value);
          });

          // Show status
          statusEl.textContent = `${t("tuning.fontLoaded")} ${fontName}`;
        } catch {
          statusEl.textContent = t("tuning.fontFailed");
          setTimeout(() => { statusEl.textContent = ""; }, 3000);
        }
        fileInput.value = "";
      });
      uploadBtn.addEventListener("click", () => fileInput.click());
      actionsRow.appendChild(uploadBtn);
      actionsRow.appendChild(fileInput);

      row.appendChild(actionsRow);

      // Status text
      const statusEl = document.createElement("div");
      statusEl.className = "tuning-font-status";
      if (customFontName) {
        statusEl.textContent = `${t("tuning.fontLoaded")} ${customFontName}`;
      }
      row.appendChild(statusEl);
    }

    section.appendChild(row);
  });

  parent.appendChild(section);
}

function toHexSafe(cssColor) {
  if (!cssColor) return "#000000";
  const trimmed = cssColor.trim();
  if (trimmed.startsWith("#") && (trimmed.length === 7 || trimmed.length === 4)) {
    return trimmed.length === 4
      ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
      : trimmed;
  }
  // rgb()/rgba(): drop alpha, the picker only handles opaque hex.
  const rgb = trimmed.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) {
    return "#" + rgb.slice(1, 4).map((n) => Math.min(255, +n).toString(16).padStart(2, "0")).join("");
  }
  return "#000000";
}
