import type { ChatMessage } from "@/types/chat";

import { createYouTubeClient, extractChannelId } from "@/services/youtube";
import { playNotificationSound } from "@/utils/audio";

import { ChatController, MAX_MESSAGES } from "./chat-controller";

export interface YouTubeChatControllerOptions {
  channelId: string;
  apiKey: string;
  controller: ChatController;
  fadeSeconds?: number;
  ignoredUsers?: string[];
  notificationSound?: boolean;
  clientFactory?: typeof createYouTubeClient;
  playSound?: () => void;
}

export class YouTubeChatController extends EventTarget {
  private readonly channelId: string;
  private readonly apiKey: string;
  private readonly controller: ChatController;
  private readonly fadeSeconds: number;
  private readonly ignoredUsers: Set<string>;
  private readonly notificationSound: boolean;
  private readonly clientFactory: typeof createYouTubeClient;
  private readonly playSound: () => void;
  private client: ReturnType<typeof createYouTubeClient> | undefined;
  private platformMessages: ChatMessage[] = [];
  private timeouts = new Set<ReturnType<typeof setTimeout>>();
  private lastError: string | null = null;

  constructor({
    channelId,
    apiKey,
    controller,
    fadeSeconds = 0,
    ignoredUsers = [],
    notificationSound = true,
    clientFactory = createYouTubeClient,
    playSound = playNotificationSound,
  }: YouTubeChatControllerOptions) {
    super();
    this.channelId = channelId;
    this.apiKey = apiKey;
    this.controller = controller;
    this.fadeSeconds = fadeSeconds;
    this.ignoredUsers = new Set(ignoredUsers.map((user) => user.toLowerCase()));
    this.notificationSound = notificationSound;
    this.clientFactory = clientFactory;
    this.playSound = playSound;
  }

  get error(): string | null {
    return this.lastError;
  }

  start() {
    if (this.client) return;

    const extractedChannelId = extractChannelId(this.channelId);
    if (!extractedChannelId) {
      this.setError("Invalid YouTube channel ID or URL");
      return;
    }

    this.lastError = null;
    this.client = this.clientFactory(
      this.apiKey,
      extractedChannelId,
      (msg) => this.handleMessage(msg),
      (err) => this.setError(err),
    );
  }

  disconnect() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
    this.client?.disconnect();
    this.client = undefined;
  }

  private handleMessage(msg: ChatMessage) {
    if (this.ignoredUsers.has(msg.username.toLowerCase())) return;

    if (this.notificationSound) this.playSound();

    this.platformMessages = [...this.platformMessages, msg];
    if (this.platformMessages.length > MAX_MESSAGES) {
      const removed = this.platformMessages.shift()!;
      this.controller.removeById(removed.id);
    }
    this.controller.add(msg);

    if (this.fadeSeconds > 0) {
      const timeout = setTimeout(
        () => {
          this.timeouts.delete(timeout);
          this.platformMessages = this.platformMessages.filter(
            (m) => m.id !== msg.id,
          );
          this.controller.removeById(msg.id);
        },
        this.fadeSeconds * 1000 + 1000,
      );
      this.timeouts.add(timeout);
    }
  }

  private setError(err: string) {
    this.lastError = err;
    this.dispatchEvent(new CustomEvent("error", { detail: err }));
  }
}
