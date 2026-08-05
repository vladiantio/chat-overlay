import { copyToClipboard } from "@/utils/clipboard";

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

export class CopySnippetElement extends HTMLElement {
  static readonly observedAttributes = ["text", "title", "placeholder"];

  private copiedTimeout: ReturnType<typeof setTimeout> | undefined;
  private readonly handleClick = () => this.onClick();

  constructor() {
    super();
    this.classList.add("snippet");
  }

  connectedCallback() {
    this.render();
    this.querySelector("button")?.addEventListener("click", this.handleClick);
  }

  disconnectedCallback() {
    this.querySelector("button")?.removeEventListener("click", this.handleClick);
    if (this.copiedTimeout) clearTimeout(this.copiedTimeout);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  private onClick() {
    const text = this.getAttribute("text") || "";
    if (!text) return;

    if (this.copiedTimeout) clearTimeout(this.copiedTimeout);
    this.dataset.copied = "true";
    this.copiedTimeout = setTimeout(() => {
      delete this.dataset.copied;
      this.copiedTimeout = undefined;
    }, 2000);

    void copyToClipboard(text);
    this.dispatchEvent(new CustomEvent("copy", { detail: text }));
  }

  private render() {
    const text = this.getAttribute("text") || "";
    const title = this.getAttribute("title") || "Copy";
    const placeholder = this.getAttribute("placeholder") || "";

    this.innerHTML = `<pre class="snippet-text${text ? "" : " snippet-text--empty"}">${escapeHtml(text || placeholder)}</pre><button type="button" class="snippet-button" title="${escapeHtml(title)}"${text ? "" : " disabled"}>${copyIcon}${checkIcon}</button>`;
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

if (!customElements.get("copy-snippet")) {
  customElements.define("copy-snippet", CopySnippetElement);
}
