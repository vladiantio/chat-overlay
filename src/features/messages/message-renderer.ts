import { Marked, type Tokens } from "marked";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isImageOnlyToken = (token: Tokens.Generic) =>
  token.type === "image" ||
  (token.type === "text" && (token as Tokens.Text).text.trim() === "");

const markdown = new Marked({
  gfm: true,
  renderer: {
    paragraph({ tokens }) {
      const inline = this.parser.parseInline(tokens);
      const imageOnly = tokens.every(isImageOnlyToken);
      return `<p${imageOnly ? ' class="md-paragraph--image-only"' : ""}>${inline}</p>`;
    },
    blockquote({ tokens }) {
      return `<div class="md-blockquote">${this.parser.parse(tokens)}</div>`;
    },
    codespan({ text }) {
      return `<code class="md-code">${escapeHtml(text)}</code>`;
    },
    heading({ tokens, depth }) {
      return `<span class="md-heading-${depth}">${this.parser.parseInline(tokens)}</span>`;
    },
    hr() {
      return '<hr class="md-hr" />';
    },
    image({ href, title, text }) {
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ""} class="md-image" onerror="this.style.opacity='0'" />`;
    },
    link({ tokens }) {
      return `<span class="md-link">${this.parser.parseInline(tokens)}</span>`;
    },
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

export function renderMarkdown(message: string): string {
  return markdown.parse(message, { async: false });
}
