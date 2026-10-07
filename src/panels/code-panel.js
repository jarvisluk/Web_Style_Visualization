import { onChange } from "../utils/css-var-manager.js";
import { generateCSS, copyToClipboard } from "../utils/export.js";
import { t, onLangChange } from "../utils/i18n.js";
import { icon } from "../utils/icons.js";

export function renderCodePanel(container) {
  const build = () => {
    container.innerHTML = `
      <div class="ins-row">
        <p class="ui-hint">${t("code.hint")}</p>
      </div>
      <div class="ins-actions">
        <button class="ui-btn ui-btn-primary" data-copy>${icon("copy", 14)}<span>${t("code.copy")}</span></button>
        <button class="ui-btn ui-btn-ghost" data-download>${icon("download", 14)}<span>${t("code.download")}</span></button>
      </div>
      <pre class="code-block"><code></code></pre>`;

    container.querySelector("[data-download]").addEventListener("click", () => {
      const blob = new Blob([generateCSS()], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "variables.css";
      a.click();
      URL.revokeObjectURL(url);
    });

    const copyBtn = container.querySelector("[data-copy]");
    copyBtn.addEventListener("click", async () => {
      if (!(await copyToClipboard(generateCSS()))) return;
      copyBtn.innerHTML = `${icon("check", 14)}<span>${t("code.copied")}</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `${icon("copy", 14)}<span>${t("code.copy")}</span>`;
      }, 1600);
    });

    update();
  };

  const update = () => {
    const codeEl = container.querySelector("code");
    if (codeEl) codeEl.innerHTML = highlightCSS(generateCSS());
  };

  build();
  onChange(update);
  onLangChange(build);
}

const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Line-based highlighter; escapes first so variable values can never inject markup.
function highlightCSS(css) {
  return css
    .split("\n")
    .map((line) => {
      const comment = line.match(/^(\s*)(\/\*.*\*\/)$/);
      if (comment) return `${comment[1]}<span class="tk-comment">${escapeHTML(comment[2])}</span>`;
      const decl = line.match(/^(\s*)(--[\w-]+)(\s*:\s*)(.*?)(;?)$/);
      if (decl) {
        const [, indent, prop, colon, value, semi] = decl;
        const swatch = /^(#|rgb|hsl|oklch)/i.test(value)
          ? `<span class="tk-swatch" style="background:${escapeHTML(value)}"></span>`
          : "";
        return `${indent}<span class="tk-prop">${escapeHTML(prop)}</span><span class="tk-punc">${escapeHTML(colon)}</span>${swatch}<span class="tk-value">${escapeHTML(value)}</span><span class="tk-punc">${semi}</span>`;
      }
      return `<span class="tk-punc">${escapeHTML(line)}</span>`;
    })
    .join("\n");
}
