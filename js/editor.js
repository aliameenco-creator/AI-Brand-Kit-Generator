// InlineEditor — supports two modes:
//   1) "single" — editing a single <text> or <tspan> element (current line only)
//   2) "wrap"   — the clicked element (or its ancestor <text>) has data-wrap="true";
//                 we edit the whole block in a textarea and word-wrap on save into
//                 a fresh set of <tspan> children.
//
// Wrap-mode attributes (on the parent <text>):
//   data-editable="true"
//   data-wrap="true"
//   data-wrap-chars="40"      max characters per line
//   data-line-height="32"     dy offset between lines (in viewBox units)
//   data-wrap-x="80"          absolute x for every tspan
//   data-field="bodyText"

const SVG_NS = "http://www.w3.org/2000/svg";

function _wrapText(text, maxChars) {
  const paragraphs = String(text || "").split(/\r?\n/);
  const lines = [];
  paragraphs.forEach(para => {
    if (!para.trim()) { lines.push(""); return; }
    const words = para.split(/\s+/);
    let cur = "";
    words.forEach(w => {
      if ((cur + " " + w).trim().length > maxChars) {
        if (cur) lines.push(cur.trim());
        // word longer than maxChars — hard split
        if (w.length > maxChars) {
          let rest = w;
          while (rest.length > maxChars) {
            lines.push(rest.slice(0, maxChars));
            rest = rest.slice(maxChars);
          }
          cur = rest;
        } else {
          cur = w;
        }
      } else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur.trim());
  });
  return lines.length ? lines : [""];
}

class InlineEditor {
  constructor(svgContainer) {
    this.container = svgContainer;
    this.activeInput = null;
    this.activeElement = null;
    this.wrapConfig = null;
    this.init();
  }

  init() {
    // Single-click on any data-editable element. For tspans inside a wrap-mode
    // parent, we route the click to the parent.
    const editables = this.container.querySelectorAll('[data-editable="true"]');
    editables.forEach(el => {
      el.style.cursor = "text";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // If this element is inside a wrap-mode parent <text>, edit the parent.
        const wrapParent = el.closest('text[data-wrap="true"]');
        if (wrapParent && wrapParent.getAttribute("data-editable") === "true") {
          return this.startWrapEdit(wrapParent);
        }
        if (el.getAttribute("data-wrap") === "true") {
          return this.startWrapEdit(el);
        }
        return this.startSingleEdit(el);
      });
    });
    // Also wire wrap parents directly (in case the user clicks empty space between tspans)
    this.container.querySelectorAll('text[data-wrap="true"][data-editable="true"]').forEach(el => {
      el.style.cursor = "text";
      if (!el._wrapBound) {
        el._wrapBound = true;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          this.startWrapEdit(el);
        });
      }
    });
  }

  startSingleEdit(el) {
    if (this.activeInput) this.stopEditing();

    const rect = el.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const text = el.textContent;
    const isLong = text.length > 50;
    const input = document.createElement(isLong ? "textarea" : "input");
    input.value = text;
    input.className = "svg-text-editor";

    const fontSize = Math.max(12, Math.min(rect.height * 0.85, 28));
    input.style.left = `${rect.left - containerRect.left}px`;
    input.style.top = `${rect.top - containerRect.top - 4}px`;
    input.style.width = `${Math.max(rect.width + 80, 220)}px`;
    input.style.fontSize = `${fontSize}px`;
    if (isLong) input.style.height = `${Math.max(rect.height + 30, 80)}px`;

    el.setAttribute("data-editing", "true");
    this.container.style.position = "relative";
    this.container.appendChild(input);
    input.focus();
    input.select();

    this.activeInput = input;
    this.activeElement = el;
    this.wrapConfig = null;

    input.addEventListener("blur", () => this.stopEditing());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); this.cancelEditing(); }
      else if (e.key === "Enter" && !isLong) { e.preventDefault(); this.stopEditing(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.stopEditing(); }
    });
  }

  startWrapEdit(textEl) {
    if (this.activeInput) this.stopEditing();

    const wrapChars = parseInt(textEl.dataset.wrapChars || "40", 10);
    const lineHeight = parseFloat(textEl.dataset.lineHeight || "32");
    const wrapX = parseFloat(textEl.dataset.wrapX || "0");

    const tspans = Array.from(textEl.querySelectorAll("tspan"));
    const fullText = tspans.length
      ? tspans.map(t => t.textContent).join(" ").replace(/\s+/g, " ").trim()
      : textEl.textContent;

    const rect = textEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    const input = document.createElement("textarea");
    input.value = fullText;
    input.className = "svg-text-editor svg-text-editor-wrap";
    input.style.left = `${Math.max(0, rect.left - containerRect.left - 8)}px`;
    input.style.top = `${rect.top - containerRect.top - 8}px`;
    input.style.width = `${Math.max(rect.width + 120, 360)}px`;
    input.style.minHeight = `${Math.max(rect.height + 60, 120)}px`;
    input.style.fontSize = "14px";

    textEl.setAttribute("data-editing", "true");
    this.container.style.position = "relative";
    this.container.appendChild(input);

    // Helper tip
    const tip = document.createElement("div");
    tip.className = "editor-tip";
    tip.textContent = "Text wraps automatically · Ctrl+Enter to save · Esc to cancel";
    tip.style.left = input.style.left;
    tip.style.top = `${parseFloat(input.style.top) - 24}px`;
    this.container.appendChild(tip);

    input.focus();
    input.select();

    this.activeInput = input;
    this.activeElement = textEl;
    this.activeTip = tip;
    this.wrapConfig = { wrapChars, lineHeight, wrapX };

    input.addEventListener("blur", () => this.stopEditing());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); this.cancelEditing(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.stopEditing(); }
    });
  }

  stopEditing() {
    if (!this.activeInput || !this.activeElement) return;

    if (this.wrapConfig) {
      const { wrapChars, lineHeight, wrapX } = this.wrapConfig;
      const lines = _wrapText(this.activeInput.value, wrapChars);
      // Wipe existing children
      while (this.activeElement.firstChild) {
        this.activeElement.removeChild(this.activeElement.firstChild);
      }
      lines.forEach((line, i) => {
        const ts = document.createElementNS(SVG_NS, "tspan");
        ts.setAttribute("x", String(wrapX));
        ts.setAttribute("dy", i === 0 ? "0" : String(lineHeight));
        ts.textContent = line;
        this.activeElement.appendChild(ts);
      });
    } else {
      this.activeElement.textContent = this.activeInput.value;
    }

    this.activeElement.removeAttribute("data-editing");
    this.activeInput.remove();
    if (this.activeTip) { this.activeTip.remove(); this.activeTip = null; }
    this.activeInput = null;
    this.activeElement = null;
    this.wrapConfig = null;
  }

  cancelEditing() {
    if (!this.activeInput || !this.activeElement) return;
    this.activeElement.removeAttribute("data-editing");
    this.activeInput.remove();
    if (this.activeTip) { this.activeTip.remove(); this.activeTip = null; }
    this.activeInput = null;
    this.activeElement = null;
    this.wrapConfig = null;
  }
}
