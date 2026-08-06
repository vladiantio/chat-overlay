// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "@/types/chat";

import "@/features/chat/chat-overlay";
import type { ChatOverlayElement } from "@/features/chat/chat-overlay";

const badge = (id: string, description: string, url: string) => ({
  id,
  version: "1",
  description,
  url,
});

const message = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "m1",
  platform: "twitch",
  username: "vladiantio",
  color: "#8b5cf6",
  timestamp: 1,
  message: "hello",
  ...overrides,
});

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(() => {
  container.remove();
  vi.useRealTimers();
});

describe("chat-overlay", () => {
  it("renders seeded messages with data-slot and data-platform attributes", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message({ message: "check" })]);
    container.append(overlay);

    const msgEl = overlay.querySelector("[data-slot='chat-message']");
    expect(msgEl).not.toBeNull();
    expect(msgEl!.getAttribute("data-platform")).toBe("twitch");
    expect(msgEl!.textContent).toContain("check");
    expect(
      overlay.querySelector("[data-slot='chat-message-user-name']")!.textContent,
    ).toBe("vladiantio");
    expect(overlay.dataset.align).toBe("left");
  });

  it("sets data-align from the alignment attribute", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.setAttribute("alignment", "right");
    overlay.seedMessages([message()]);
    container.append(overlay);
    expect(overlay.dataset.align).toBe("right");
  });

  it("sets --color, --subtle-color, and --tint-color on each message", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message({ color: "#8b5cf6" })]);
    container.append(overlay);

    const msgEl = overlay.querySelector<HTMLElement>(
      "[data-slot='chat-message']",
    )!;
    expect(msgEl.style.getPropertyValue("--color")).toBe("#8b5cf6");
    expect(msgEl.style.getPropertyValue("--subtle-color")).toBe(
      "color-mix(in oklab, #8b5cf6 5%, var(--color-neutral-900))",
    );
    expect(msgEl.style.getPropertyValue("--tint-color")).toBe(
      "color-mix(in oklab, #8b5cf6 60%, #fff)",
    );
  });

  it("renders badges with the badge data-slot", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([
      message({ badges: [badge("broadcaster", "Broadcaster", "https://x/1.png")] }),
    ]);
    container.append(overlay);

    const badgeEl = overlay.querySelector("[data-slot='chat-message-badge']");
    expect(badgeEl!.getAttribute("src")).toBe("https://x/1.png");
    expect(badgeEl!.getAttribute("alt")).toBe("Broadcaster");
  });

  it("renders a reply block when the message has a replyTo", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([
      message({
        replyTo: { id: "m0", username: "other", message: "original" },
      }),
    ]);
    container.append(overlay);

    const reply = overlay.querySelector(".chat-reply");
    expect(reply!.textContent).toBe("other: original");
  });

  it("stacks the bubble for a same-user follow-up message", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([
      message({ id: "m1" }),
      message({ id: "m2", isSamePreviousUser: true }),
    ]);
    container.append(overlay);

    const bubbles = overlay.querySelectorAll(".chat-bubble");
    expect(bubbles[0].classList.contains("chat-bubble--stacked")).toBe(false);
    expect(bubbles[1].classList.contains("chat-bubble--stacked")).toBe(true);
  });

  it("hides the user row for stacked messages", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([
      message({ id: "m1" }),
      message({ id: "m2", isSamePreviousUser: true }),
    ]);
    container.append(overlay);
    expect(
      overlay.querySelectorAll("[data-slot='chat-message-user-name']"),
    ).toHaveLength(1);
  });

  it("renders platform icons only when show-platform is true", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message()]);
    container.append(overlay);
    expect(
      overlay.querySelector("[data-slot='chat-message-user-platform']"),
    ).toBeNull();

    const withIcons = document.createElement(
      "chat-overlay",
    ) as ChatOverlayElement;
    withIcons.setAttribute("show-platform", "true");
    withIcons.seedMessages([
      message(),
      message({ id: "m2", platform: "youtube", username: "viewer" }),
    ]);
    container.append(withIcons);
    expect(
      withIcons.querySelectorAll("[data-slot='chat-message-user-platform']"),
    ).toHaveLength(2);
  });

  it("applies the fade-out animation when fade is set", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.setAttribute("fade", "3");
    overlay.seedMessages([message()]);
    container.append(overlay);

    const msgEl = overlay.querySelector<HTMLElement>(
      "[data-slot='chat-message']",
    )!;
    expect(msgEl.style.animation).toContain("fadeOut");
    expect(msgEl.style.animation).toContain("2750ms");
  });

  it("does not apply the fade-out animation when fade is 0", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message()]);
    container.append(overlay);

    const msgEl = overlay.querySelector<HTMLElement>(
      "[data-slot='chat-message']",
    )!;
    expect(msgEl.style.animation).toBe("");
  });

  it("escapes user-controlled text in the rendered output", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([
      message({ username: "<script>", message: "hello" }),
    ]);
    container.append(overlay);
    expect(overlay.querySelector("[data-slot='chat-message-user-name']")!.textContent).toBe(
      "<script>",
    );
    expect(overlay.innerHTML).not.toContain("<script>");
  });

  it("re-renders the message list when the store changes", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message({ id: "m1" })]);
    container.append(overlay);
    const before = overlay.querySelectorAll("[data-slot='chat-message']").length;
    expect(before).toBe(1);

    overlay.seedMessages([
      message({ id: "m1" }),
      message({ id: "m2" }),
    ]);
    const after = overlay.querySelectorAll("[data-slot='chat-message']").length;
    expect(after).toBe(2);
  });

  it("does not replace existing message elements when a message is added", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message({ id: "m1", message: "first" })]);
    container.append(overlay);

    const first = overlay.querySelector("[data-slot='chat-message']")!;
    overlay.store.add(
      message({ id: "m2", username: "other", timestamp: 2, message: "second" }),
    );

    const nodes = overlay.querySelectorAll("[data-slot='chat-message']");
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toBe(first);
    expect(nodes[1].textContent).toContain("second");
  });

  it("removes the message element when a message is removed from the store", () => {
    const overlay = document.createElement("chat-overlay") as ChatOverlayElement;
    overlay.seedMessages([message({ id: "m1" }), message({ id: "m2" })]);
    container.append(overlay);

    const first = overlay.querySelector("[data-slot='chat-message']")!;
    overlay.store.removeById("m2");

    const nodes = overlay.querySelectorAll("[data-slot='chat-message']");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe(first);
  });
});

declare global {
  interface HTMLElementTagNameMap {
    "chat-overlay": import("@/features/chat/chat-overlay").ChatOverlayElement;
  }
}
