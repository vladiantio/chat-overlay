import { describe, expect, it } from "vitest";

import { parseMarkdown } from "./parsers";
import { renderMarkdown } from "./message-renderer";

describe("renderMarkdown", () => {
  it("renders paragraphs without extra classes", () => {
    expect(renderMarkdown("hello world")).toBe("<p>hello world</p>");
  });

  it("renders headings as md-heading-N spans", () => {
    expect(renderMarkdown("## Schedule")).toBe(
      '<span class="md-heading-2">Schedule</span>',
    );
    expect(renderMarkdown("###### tiny")).toBe(
      '<span class="md-heading-6">tiny</span>',
    );
  });

  it("renders blockquotes as div.md-blockquote", () => {
    expect(renderMarkdown("> Monday: ranked grind")).toBe(
      '<div class="md-blockquote"><p>Monday: ranked grind</p></div>',
    );
  });

  it("renders codespans as code.md-code", () => {
    expect(renderMarkdown("Nice play `!follow`")).toBe(
      '<p>Nice play <code class="md-code">!follow</code></p>',
    );
  });

  it("renders thematic breaks as hr.md-hr", () => {
    expect(renderMarkdown("---")).toBe('<hr class="md-hr" />');
  });

  it("renders a paragraph of only images with the image-only class", () => {
    const src = "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/2.0";
    expect(renderMarkdown(`![PogChamp](${src})`)).toBe(
      `<p class="md-paragraph--image-only"><img src="${src}" alt="PogChamp" class="md-image" onerror="this.style.opacity='0'" /></p>`,
    );
  });

  it("keeps the image-only class when trailing whitespace follows the image", () => {
    const src = "https://cdn.7tv.app/emote/01GSGH3BEG000FPAS8YRCNDDSK/2x.avif";
    expect(renderMarkdown(`![HUH](${src}) `)).toBe(
      `<p class="md-paragraph--image-only"><img src="${src}" alt="HUH" class="md-image" onerror="this.style.opacity='0'" /> </p>`,
    );
  });

  it("omits the image-only class when text accompanies the image", () => {
    expect(renderMarkdown("![PogChamp](https://x/1) hey")).toBe(
      '<p><img src="https://x/1" alt="PogChamp" class="md-image" onerror="this.style.opacity=\'0\'" /> hey</p>',
    );
  });

  it("renders links as span.md-link without the href", () => {
    expect(renderMarkdown("[click here](https://example.com)")).toBe(
      '<p><span class="md-link">click here</span></p>',
    );
  });

  it("escapes raw HTML instead of executing it", () => {
    const output = renderMarkdown("<img src=x onerror=alert(1)>");
    expect(output).toContain("&lt;img");
    expect(output).not.toContain("<img");
    expect(output).not.toContain("<img src=x>");
  });

  it("escapes script tags", () => {
    const output = renderMarkdown("<script>alert('xss')</script>");
    expect(output).toContain("&lt;script&gt;");
    expect(output).not.toContain("<script>");
  });

  it("renders the full demo message shape", () => {
    const md = parseMarkdown("## Schedule\n\n> Monday: ranked grind\n\nNice play @vladiantio `!follow`");
    expect(renderMarkdown(md)).toBe(
      '<span class="md-heading-2">Schedule</span><div class="md-blockquote"><p>Monday: ranked grind</p></div><p>Nice play <strong>@vladiantio</strong> <code class="md-code">!follow</code></p>',
    );
  });
});
