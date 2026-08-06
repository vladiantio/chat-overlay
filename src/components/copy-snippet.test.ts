// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "@/components/copy-snippet";

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  container.remove();
  vi.useRealTimers();
});

describe("copy-snippet", () => {
  it("renders the text in a snippet-text pre", () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "https://example.com");
    snippet.setAttribute("title", "Copy");
    container.append(snippet);

    const pre = snippet.querySelector(".snippet-text");
    expect(pre!.textContent).toBe("https://example.com");
    expect(
      snippet.querySelector(".snippet-button")!.hasAttribute("disabled"),
    ).toBe(false);
  });

  it("shows the placeholder and disables the button without text", () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("placeholder", "https://fallback.com");
    container.append(snippet);

    const pre = snippet.querySelector(".snippet-text");
    expect(pre!.textContent).toBe("https://fallback.com");
    expect(pre!.classList.contains("snippet-text--empty")).toBe(true);
    expect(
      snippet.querySelector(".snippet-button")!.hasAttribute("disabled"),
    ).toBe(true);
  });

  it("copies to the clipboard and marks the snippet as copied", async () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "https://example.com");
    container.append(snippet);

    snippet.querySelector<HTMLButtonElement>(".snippet-button")!.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://example.com",
    );
    expect(snippet.dataset.copied).toBe("true");
  });

  it("resets the copied state after 2 seconds", () => {
    vi.useFakeTimers();
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "https://example.com");
    container.append(snippet);

    snippet.querySelector<HTMLButtonElement>(".snippet-button")!.click();
    expect(snippet.dataset.copied).toBe("true");
    vi.advanceTimersByTime(1999);
    expect(snippet.dataset.copied).toBe("true");
    vi.advanceTimersByTime(1);
    expect(snippet.dataset.copied).toBeUndefined();
  });

  it("emits a copy event with the copied text", () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "https://example.com");
    container.append(snippet);

    const onCopy = vi.fn();
    snippet.addEventListener("copy", onCopy as EventListener);
    snippet.querySelector<HTMLButtonElement>(".snippet-button")!.click();
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect((onCopy.mock.calls[0][0] as CustomEvent<string>).detail).toBe(
      "https://example.com",
    );
  });

  it("does nothing when the button is disabled", () => {
    const snippet = document.createElement("copy-snippet");
    container.append(snippet);

    snippet.querySelector<HTMLButtonElement>(".snippet-button")!.click();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(snippet.dataset.copied).toBeUndefined();
  });

  it("updates the text in place when the text attribute changes", () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "one");
    container.append(snippet);
    snippet.setAttribute("text", "two");
    expect(snippet.querySelector(".snippet-text")!.textContent).toBe("two");
  });

  it("keeps the button functional after a text attribute change", () => {
    const snippet = document.createElement("copy-snippet");
    snippet.setAttribute("text", "one");
    container.append(snippet);
    snippet.setAttribute("text", "two");

    snippet.querySelector<HTMLButtonElement>(".snippet-button")!.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("two");
  });
});
