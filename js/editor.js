class InlineEditor {
  constructor(svgContainer) {
    this.container = svgContainer;
    this.activeInput = null;
    this.activeElement = null;
    this.init();
  }

  init() {
    const editables = this.container.querySelectorAll('[data-editable="true"]');
    editables.forEach(el => {
      el.style.cursor = "text";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.startEditing(el);
      });
    });
  }

  startEditing(svgTextElement) {
    if (this.activeInput) this.stopEditing();

    const rect = svgTextElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    const text = svgTextElement.textContent;
    const isLongText = text.length > 50;
    const input = document.createElement(isLongText ? "textarea" : "input");

    input.value = text;
    input.className = "svg-text-editor";

    // Approximate scaled font size from rect height
    const fontSize = Math.max(12, Math.min(rect.height * 0.85, 24));

    input.style.left = `${rect.left - containerRect.left}px`;
    input.style.top = `${rect.top - containerRect.top - 4}px`;
    input.style.width = `${Math.max(rect.width + 60, 180)}px`;
    input.style.fontSize = `${fontSize}px`;
    if (isLongText) input.style.height = `${Math.max(rect.height + 20, 60)}px`;

    svgTextElement.setAttribute("data-editing", "true");

    this.container.style.position = "relative";
    this.container.appendChild(input);
    input.focus();
    input.select();

    this.activeInput = input;
    this.activeElement = svgTextElement;

    input.addEventListener("blur", () => this.stopEditing());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !isLongText) {
        e.preventDefault();
        this.stopEditing();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEditing();
      } else if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        this.stopEditing();
      }
    });
  }

  stopEditing() {
    if (!this.activeInput || !this.activeElement) return;
    this.activeElement.textContent = this.activeInput.value;
    this.activeElement.removeAttribute("data-editing");
    this.activeInput.remove();
    this.activeInput = null;
    this.activeElement = null;
  }

  cancelEditing() {
    if (!this.activeInput || !this.activeElement) return;
    this.activeElement.removeAttribute("data-editing");
    this.activeInput.remove();
    this.activeInput = null;
    this.activeElement = null;
  }
}
