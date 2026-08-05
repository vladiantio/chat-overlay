import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "@/types/chat";

import { ChatController } from "./chat-controller";
import { YouTubeChatController, type YouTubeChatControllerOptions } from "./youtube-chat-controller";

const message = (id: string, username = "viewer"): ChatMessage => ({
  id,
  username,
  color: "#fff",
  message: "hi",
  platform: "youtube",
  timestamp: Date.now(),
});

interface FakeClient {
  onMessage: (msg: ChatMessage) => void;
  onError: (err: string) => void;
  disconnect: ReturnType<typeof vi.fn>;
}

const makeFakeFactory = () => {
  let client: FakeClient;
  let receivedChannelId: string | undefined;
  const factory = (
    _apiKey: string,
    channelId: string,
    onMessage: (msg: ChatMessage) => void,
    onError: (err: string) => void,
  ) => {
    receivedChannelId = channelId;
    client = { onMessage, onError, disconnect: vi.fn() };
    return client;
  };
  return {
    factory: factory as unknown as typeof import("@/services/youtube").createYouTubeClient,
    getClient: () => client,
    getChannelId: () => receivedChannelId,
  };
};

const setup = (options: Partial<YouTubeChatControllerOptions> = {}) => {
  const controller = new ChatController();
  const fake = makeFakeFactory();
  const playSound = vi.fn();
  const chat = new YouTubeChatController({
    channelId: "UCX6Wc6iura2Yy2F0vBY9BzA",
    apiKey: "key",
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

describe("YouTubeChatController", () => {
  it("forwards messages into the shared controller", () => {
    const { controller, chat, fake } = setup();
    chat.start();
    fake.getClient().onMessage(message("m1"));
    expect(controller.messages.map((m) => m.id)).toEqual(["m1"]);
  });

  it("extracts the channel ID from a URL before connecting", () => {
    const { chat, fake } = setup();
    chat.start();
    expect(fake.getChannelId()).toBe("UCX6Wc6iura2Yy2F0vBY9BzA");
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
      ignoredUsers: ["banned"],
    });
    chat.start();
    fake.getClient().onMessage(message("m1", "banned"));
    fake.getClient().onMessage(message("m2", "viewer"));
    expect(controller.messages.map((m) => m.id)).toEqual(["m2"]);
  });

  it("plays the notification sound when enabled", () => {
    const { chat, fake, playSound } = setup({ notificationSound: true });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it("removes messages after the fade delay plus a 1s offset", () => {
    vi.useFakeTimers();
    const { controller, chat, fake } = setup({ fadeSeconds: 3 });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    vi.advanceTimersByTime(2000);
    fake.getClient().onMessage(message("m2"));
    vi.advanceTimersByTime(1999);
    expect(controller.messages).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(controller.messages.map((m) => m.id)).toEqual(["m2"]);
    vi.advanceTimersByTime(1999);
    expect(controller.messages).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(controller.messages).toHaveLength(0);
  });

  it("records client errors and emits an error event", () => {
    const { chat, fake } = setup();
    const onError = vi.fn();
    chat.addEventListener("error", onError as EventListener);
    chat.start();
    fake.getClient().onError("Stream has ended");
    expect(chat.error).toBe("Stream has ended");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("clears pending fade timeouts on disconnect", () => {
    vi.useFakeTimers();
    const { controller, chat, fake } = setup({ fadeSeconds: 3 });
    chat.start();
    fake.getClient().onMessage(message("m1"));
    chat.disconnect();
    vi.advanceTimersByTime(10000);
    expect(controller.messages).toHaveLength(1);
  });

  it("disconnects the client on disconnect", () => {
    const { chat, fake } = setup();
    chat.start();
    chat.disconnect();
    expect(fake.getClient().disconnect).toHaveBeenCalledTimes(1);
  });
});
