// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "@/components/chat-setup";
import "@/features/chat/chat-overlay";

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(() => {
  container.remove();
});

describe("chat-setup", () => {
  it("renders the form, snippet, and preview hint", () => {
    const setup = document.createElement("chat-setup");
    container.append(setup);

    expect(setup.querySelector("input#twitchChannel")).not.toBeNull();
    expect(setup.querySelector("copy-snippet")).not.toBeNull();
    expect(setup.querySelector(".setup-hint")).not.toBeNull();
    expect(
      setup.querySelector<HTMLButtonElement>(".setup-button")!.disabled,
    ).toBe(true);
  });

  it("updates the overlay URL snippet and enables the button while typing", () => {
    const setup = document.createElement("chat-setup");
    container.append(setup);

    const input = setup.querySelector<HTMLInputElement>("#twitchChannel")!;
    input.value = "myChannel";
    input.dispatchEvent(new Event("input"));

    const snippet = setup.querySelector("copy-snippet")!;
    expect(snippet.getAttribute("text")).toBe(
      `${location.href}?twitch=myChannel`,
    );
    expect(
      setup.querySelector<HTMLButtonElement>(".setup-button")!.disabled,
    ).toBe(false);
  });

  it("clears the snippet text when the input is emptied", () => {
    const setup = document.createElement("chat-setup");
    container.append(setup);

    const input = setup.querySelector<HTMLInputElement>("#twitchChannel")!;
    input.value = "myChannel";
    input.dispatchEvent(new Event("input"));
    input.value = "";
    input.dispatchEvent(new Event("input"));

    expect(setup.querySelector("copy-snippet")!.hasAttribute("text")).toBe(false);
    expect(
      setup.querySelector<HTMLButtonElement>(".setup-button")!.disabled,
    ).toBe(true);
  });

  it("creates a chat-overlay preview on submit", () => {
    const setup = document.createElement("chat-setup");
    container.append(setup);

    const input = setup.querySelector<HTMLInputElement>("#twitchChannel")!;
    input.value = "myChannel";
    input.dispatchEvent(new Event("input"));
    setup.querySelector<HTMLFormElement>("form")!.dispatchEvent(
      new Event("submit", { cancelable: true }),
    );

    const preview = setup.querySelector("chat-overlay");
    expect(preview).not.toBeNull();
    expect(preview!.getAttribute("twitch")).toBe("myChannel");
    expect(setup.querySelector(".setup-hint")).toBeNull();
  });

  it("URL-encodes the channel in the overlay URL", () => {
    const setup = document.createElement("chat-setup");
    container.append(setup);

    const input = setup.querySelector<HTMLInputElement>("#twitchChannel")!;
    input.value = "a b&c";
    input.dispatchEvent(new Event("input"));

    expect(setup.querySelector("copy-snippet")!.getAttribute("text")).toBe(
      `${location.href}?twitch=a%20b%26c`,
    );
  });
});
