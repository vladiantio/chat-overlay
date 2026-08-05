import "@/components/copy-snippet";

export class ChatSetupElement extends HTMLElement {
  private previewChannel = "";

  connectedCallback() {
    this.render();
    this.querySelector("input")?.addEventListener("input", () =>
      this.syncFromInput(),
    );
    this.querySelector("form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = this.querySelector<HTMLInputElement>("#twitchChannel");
      this.previewChannel = input?.value.trim() || "";
      this.renderPreview();
      this.querySelector("[data-slot='setup-preview']")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    this.syncFromInput();
  }

  private get channel(): string {
    return (
      this.querySelector<HTMLInputElement>("#twitchChannel")?.value.trim() || ""
    );
  }

  private get overlayUrl(): string | undefined {
    return this.channel
      ? `${location.href}?twitch=${encodeURIComponent(this.channel)}`
      : undefined;
  }

  private syncFromInput() {
    const snippet = this.querySelector<HTMLElement>("copy-snippet");
    const url = this.overlayUrl;
    if (snippet) {
      if (url) snippet.setAttribute("text", url);
      else snippet.removeAttribute("text");
    }
    const button = this.querySelector<HTMLButtonElement>(".setup-button");
    if (button) button.disabled = !this.channel;
  }

  private renderPreview() {
    const container = this.querySelector<HTMLElement>(
      "[data-slot='setup-preview']",
    );
    if (!container) return;
    container.innerHTML = this.previewChannel
      ? `<chat-overlay class="setup-preview" twitch="${escapeAttr(this.previewChannel)}"></chat-overlay>`
      : '<p class="setup-hint">Enter a Twitch channel and click "Preview" to see the chat overlay.</p>';
  }

  private render() {
    this.innerHTML = `<div class="setup"><div class="setup-card"><h2 class="setup-title">Chat Overlay</h2><form class="setup-form"><div class="setup-field"><label class="setup-label" for="twitchChannel">Twitch Channel</label><input class="setup-input" id="twitchChannel" type="text" placeholder="Enter Twitch Channel (e.g., vladiantio)" autofocus required /></div><div class="setup-field"><label class="setup-label">Overlay URL</label><copy-snippet title="Copy Overlay URL" placeholder="${escapeAttr(location.href)}"></copy-snippet></div><button type="submit" class="setup-button" disabled>Preview</button></form></div><div class="setup-card setup-card--center" data-slot="setup-preview">${this.previewChannel ? `<chat-overlay class="setup-preview" twitch="${escapeAttr(this.previewChannel)}"></chat-overlay>` : '<p class="setup-hint">Enter a Twitch channel and click "Preview" to see the chat overlay.</p>'}</div></div>`;
  }
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

if (!customElements.get("chat-setup")) {
  customElements.define("chat-setup", ChatSetupElement);
}
