import type { ChatMessage } from "@/types/chat";

import { createTwitchClient } from "@/services/twitch";
import { playNotificationSound } from "@/utils/audio";

import { ChatController, MAX_MESSAGES } from "./chat-controller";

export interface TwitchChatControllerOptions {
  channel: string;
  controller: ChatController;
  fadeSeconds?: number;
  ignoredUsers?: string[];
  notificationSound?: boolean;
  clientFactory?: typeof createTwitchClient;
  playSound?: () => void;
}

export class TwitchChatController {
  private readonly channel: string;
  private readonly controller: ChatController;
  private readonly fadeSeconds: number;
  private readonly ignoredUsers: Set<string>;
  private readonly notificationSound: boolean;
  private readonly clientFactory: typeof createTwitchClient;
  private readonly playSound: () => void;
  private client: ReturnType<typeof createTwitchClient> | undefined;
  private platformMessages: ChatMessage[] = [];
  private timeouts = new Set<ReturnType<typeof setTimeout>>();

  constructor({
    channel,
    controller,
    fadeSeconds = 0,
    ignoredUsers = [],
    notificationSound = false,
    clientFactory = createTwitchClient,
    playSound = playNotificationSound,
  }: TwitchChatControllerOptions) {
    this.channel = channel;
    this.controller = controller;
    this.fadeSeconds = fadeSeconds;
    this.ignoredUsers = new Set(ignoredUsers.map((user) => user.toLowerCase()));
    this.notificationSound = notificationSound;
    this.clientFactory = clientFactory;
    this.playSound = playSound;
  }

  start() {
    if (this.client) return;
    this.client = this.clientFactory(
      this.channel,
      (msg) => this.handleMessage(msg),
      (id) => this.handleDeleted(id),
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
        this.fadeSeconds * 1000,
      );
      this.timeouts.add(timeout);
    }
  }

  private handleDeleted(id: string) {
    this.platformMessages = this.platformMessages.filter((m) => m.id !== id);
    this.controller.removeById(id);
  }
}
