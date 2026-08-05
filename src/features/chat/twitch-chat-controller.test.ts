import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "@/types/chat";

import { ChatController } from "./chat-controller";
import { TwitchChatController, type TwitchChatControllerOptions } from "./twitch-chat-controller";

const message = (id: string, username = "user"): ChatMessage => ({
  id,
  username,
  color: "#fff",
  message: "hi",
  platform: "twitch",
  timestamp: Date.now(),
});

interface FakeClient {
  onMessage: (msg: ChatMessage) => void;
  onDeleted: (id: string) => void;
  disconnect: ReturnType<typeof vi.fn>;
}

const makeFakeFactory = () => {
  let client: FakeClient;
  const factory = (
    _channel: string,
    onMessage: (msg: ChatMessage) => void,
    onDeleted: (id: string) => void,
  ) => {
    client = { onMessage, onDeleted, disconnect: vi.fn() };
    return client;
  };
  return {
    factory: factory as unknown as typeof import("@/services/twitch").createTwitchClient,
    getClient: () => client,
  };
};

const setup = (options: Partial<TwitchChatControllerOptions> = {}) => {
  const controller = new ChatController();
  const fake = makeFakeFactory();
  const playSound = vi.fn();
  const chat = new TwitchChatController({
    channel: "channel",
    controller,
    clientFactory: fake.factory,
    playSound,
    ...options,
  });
  return { controller, fake, playSound, chat };
};

afterEach(() => {
  vi.useRealTimers();
});

describe("TwitchChatController", () => {
  it("forwards messages into the shared controller", () => {
    const { controller, chat, fake } = setup();
    chat.start();
    fake.getClient().onMessage(message("m1"));
    expect(controller.messages.map((m) => m.id)).toEqual(["m1"]);
  });

  it("emits a change event on the controller for each message", () => {
    const { controller, chat, fake } = setup();
    const listener = vi.fn();
    controller.addEventListener("change", listener);
    chat.start();
    fake.getClient().onMessage(message("m1"));
    fake.getClient().onMessage(message("m2"));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("caps messages at 10, removing the oldest first", () => {
    const { controller, chat, fake } = setup();
    chat.start();
    for (let i = 1; i <= 12; i++) {
      fake.getClient().onMessage(message(`m${i}`));
    }
    expect(controller.messages.map((m) => m.id)).toEqual([
      "m3",
      "m4",
      "m5",
      "m6",
      "m7",
      "m8",
      "m9",
      "m10",
      "m11",
      "m12",
    ]);
  });

  it("ignores messages from ignored users", () => {
    const { controller, chat, fake } = setup({
      ignoredUsers: ["banned", "Muted"],
    });
    chat.start();
    fake.getClient().onMessage(message("m1", "banned"));
    fake.getClient().onMessage(message("m2", "Muted"));
    fake.getClient().onMessage(message("m3", "ok"));
    expect(controller.messages.map((m) => m.id)).toEqual(["m3"]);
  });

  it("plays the notification sound when enabled", () => {
    const { chat, fake, playSound } = setup({ notificationSound: true });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it("keeps the sound silent when disabled", () => {
    const { chat, fake, playSound } = setup({ notificationSound: false });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    expect(playSound).not.toHaveBeenCalled();
  });

  it("removes a deleted message by id", () => {
    const { controller, chat, fake } = setup();
    chat.start();
    fake.getClient().onMessage(message("m1"));
    fake.getClient().onDeleted("m1");
    expect(controller.messages).toHaveLength(0);
  });

  it("removes messages after the fade delay", () => {
    vi.useFakeTimers();
    const { controller, chat, fake } = setup({ fadeSeconds: 3 });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    vi.advanceTimersByTime(2000);
    fake.getClient().onMessage(message("m2"));
    expect(controller.messages).toHaveLength(2);
    vi.advanceTimersByTime(999);
    expect(controller.messages).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(controller.messages.map((m) => m.id)).toEqual(["m2"]);
    vi.advanceTimersByTime(1999);
    expect(controller.messages.map((m) => m.id)).toEqual(["m2"]);
    vi.advanceTimersByTime(1);
    expect(controller.messages).toHaveLength(0);
  });

  it("clears pending fade timeouts on disconnect", () => {
    vi.useFakeTimers();
    const { controller, chat, fake } = setup({ fadeSeconds: 3 });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    chat.disconnect();
    vi.advanceTimersByTime(5000);
    expect(controller.messages).toHaveLength(1);
  });

  it("disconnects the client on disconnect", () => {
    const { chat, fake } = setup();
    chat.start();
    chat.disconnect();
    expect(fake.getClient().disconnect).toHaveBeenCalledTimes(1);
  });
});
