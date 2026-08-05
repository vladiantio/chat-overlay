import { describe, expect, it } from "vitest";
import type { ContainerNode } from "takumi-js";

import type { ChatMessage } from "@/types/chat";

import { messageColors, ogChatPreviewNode } from "./chat-og";

describe("messageColors", () => {
  it("computes tint, subtle, and textOnTint from a hex color", () => {
    expect(messageColors("#8b5cf6")).toEqual({
      tint: "rgb(209, 190, 251)",
      subtle: "rgb(29, 26, 34)",
      textOnTint: "#111111",
    });
  });

  it("mixes 60% white into the tint, so even black yields light text", () => {
    expect(messageColors("#000000").tint).toBe("rgb(153, 153, 153)");
    expect(messageColors("#000000").textOnTint).toBe("#111111");
  });

  it("accepts short hex notation", () => {
    expect(messageColors("#fff").tint).toBe("rgb(255, 255, 255)");
  });
});

describe("ogChatPreviewNode", () => {
  const message: ChatMessage = {
    id: "m1",
    platform: "twitch",
    username: "vladiantio",
    color: "#8b5cf6",
    timestamp: 1,
    message: "hello",
  };

  it("aligns message content to the left by default", () => {
    const node = ogChatPreviewNode([message]) as ContainerNode;
    const row = node.children![0] as ContainerNode;
    expect(row.style!.alignItems).toBe("flex-start");
    const pill = (row.children ?? []).find((c) => c.style?.position === "absolute");
    expect(pill!.style!.left).toBe(0);
    expect(pill!.style!.right).toBeUndefined();
  });

  it("flips alignment and the user pill to the right side", () => {
    const node = ogChatPreviewNode([message], { alignment: "right" }) as ContainerNode;
    const row = node.children![0] as ContainerNode;
    expect(row.style!.alignItems).toBe("flex-end");
    const pill = (row.children ?? []).find((c) => c.style?.position === "absolute");
    expect(pill!.style!.left).toBeUndefined();
    expect(pill!.style!.right).toBe(0);
  });
});
