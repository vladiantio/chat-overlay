import { describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "@/types/chat";

import { ChatController } from "./chat-controller";

const message = (id: string, timestamp: number): ChatMessage => ({
  id,
  username: "user",
  color: "#fff",
  message: "hi",
  platform: "twitch",
  timestamp,
});

describe("ChatController", () => {
  it("emits a change event on add", () => {
    const controller = new ChatController();
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    controller.add(message("m1", 1));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.messages.map((m) => m.id)).toEqual(["m1"]);
  });

  it("inserts messages sorted by timestamp", () => {
    const controller = new ChatController();
    controller.add(message("late", 30));
    controller.add(message("early", 10));
    controller.add(message("middle", 20));
    expect(controller.messages.map((m) => m.id)).toEqual([
      "early",
      "middle",
      "late",
    ]);
  });

  it("keeps equal timestamps in arrival order", () => {
    const controller = new ChatController();
    controller.add(message("a", 5));
    controller.add(message("b", 5));
    expect(controller.messages.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("removes a message by id and emits change", () => {
    const controller = new ChatController();
    controller.add(message("m1", 1));
    controller.add(message("m2", 2));
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    controller.removeById("m1");
    expect(controller.messages.map((m) => m.id)).toEqual(["m2"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not emit change when removing an unknown id", () => {
    const controller = new ChatController();
    controller.add(message("m1", 1));
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    controller.removeById("nope");
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears all messages and emits change", () => {
    const controller = new ChatController();
    controller.add(message("m1", 1));
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    controller.clear();
    expect(controller.messages).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not emit change when clearing an empty controller", () => {
    const controller = new ChatController();
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    controller.clear();
    expect(listener).not.toHaveBeenCalled();
  });
});
