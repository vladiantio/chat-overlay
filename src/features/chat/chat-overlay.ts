import type { ChatMessage } from "@/types/chat";

import {
  escapeHtml,
  renderMarkdown,
} from "@/features/messages/message-renderer";
import { parseMarkdown } from "@/features/messages/parsers";

import { twitchIcon, youTubeIcon } from "./chat-icons";
import { ChatController } from "./chat-controller";
import { TwitchChatController } from "./twitch-chat-controller";
import { YouTubeChatController } from "./youtube-chat-controller";

const FADE_DURATION_MS = 250;
const FADE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export class ChatOverlayElement extends HTMLElement {
  static readonly observedAttributes = [
    "twitch",
    "youtube",
    "youtube-key",
    "fade",
    "alignment",
    "show-platform",
    "ignore",
    "notification-sound",
  ];

  store = new ChatController();
  private twitchController: TwitchChatController | undefined;
  private youtubeController: YouTubeChatController | undefined;
  private initialMessages: ChatMessage[] = [];
  private nodesById = new Map<string, HTMLElement>();
  private htmlById = new Map<string, string>();
  private readonly handleStoreChange = () => this.renderMessages();

  constructor() {
    super();
    this.classList.add("chat-container", "chat-screen");
  }

  connectedCallback() {
    if (!this.querySelector(".chat-messages")) {
      const messages = document.createElement("div");
      messages.className = "chat-messages";
      this.append(messages);
    }
    this.store.addEventListener("change", this.handleStoreChange);
    this.configure();
  }

  disconnectedCallback() {
    this.store.removeEventListener("change", this.handleStoreChange);
    this.twitchController?.disconnect();
    this.twitchController = undefined;
    this.youtubeController?.disconnect();
    this.youtubeController = undefined;
  }

  /** Seed messages instead of connecting to chat platforms (demo mode). */
  seedMessages(messages: ChatMessage[]) {
    this.initialMessages = messages;
    if (this.isConnected) this.configure();
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this.configure();
  }

  private configure() {
    this.twitchController?.disconnect();
    this.twitchController = undefined;
    this.youtubeController?.disconnect();
    this.youtubeController = undefined;

    this.dataset.align = this.alignment;
    this.store.clear();

    if (this.initialMessages.length > 0) {
      this.initialMessages.forEach((msg) => this.store.add(msg));
      this.renderMessages();
      return;
    }

    const twitchChannel = this.getAttribute("twitch") || "";
    const youtubeChannel = this.getAttribute("youtube") || "";
    const youtubeApiKey = this.getAttribute("youtube-key") || "";
    const ignoredUsers = this.ignoredUsers;
    const notificationSound = this.notificationSound;

    if (twitchChannel) {
      this.twitchController = new TwitchChatController({
        channel: twitchChannel,
        controller: this.store,
        fadeSeconds: this.fadeSeconds,
        ignoredUsers,
        notificationSound,
      });
      this.twitchController.start();
    }
    if (youtubeChannel && youtubeApiKey) {
      this.youtubeController = new YouTubeChatController({
        channelId: youtubeChannel,
        apiKey: youtubeApiKey,
        controller: this.store,
        fadeSeconds: this.fadeSeconds,
        ignoredUsers,
        notificationSound,
      });
      this.youtubeController.start();
    }
  }

  private renderMessages() {
    const list = this.querySelector(".chat-messages");
    if (!list) return;

    const messages = this.store.messages;
    const ids = new Set(messages.map((msg) => msg.id));

    for (const [id, node] of this.nodesById) {
      if (ids.has(id)) continue;
      node.remove();
      this.nodesById.delete(id);
      this.htmlById.delete(id);
    }

    messages.forEach((msg, index) => {
      const html = this.messageHtml(msg, index);
      const existing = this.nodesById.get(msg.id);
      if (existing) {
        if (this.htmlById.get(msg.id) === html) return;
        const replacement = this.messageElement(html);
        existing.replaceWith(replacement);
        this.nodesById.set(msg.id, replacement);
        this.htmlById.set(msg.id, html);
        this.applyMessageColors(replacement, msg);
        return;
      }

      const node = this.messageElement(html);
      const anchor = messages
        .slice(index + 1)
        .map((next) => this.nodesById.get(next.id))
        .find((nextNode) => nextNode !== undefined);
      if (anchor) list.insertBefore(node, anchor);
      else list.append(node);
      this.nodesById.set(msg.id, node);
      this.htmlById.set(msg.id, html);
      this.applyMessageColors(node, msg);
    });

    this.scrollTop = this.scrollHeight;
  }

  private messageElement(html: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const element = wrapper.firstElementChild as HTMLElement;
    wrapper.removeChild(element);
    return element;
  }

  private applyMessageColors(node: HTMLElement, msg: ChatMessage) {
    node.style.setProperty("--color", msg.color);
    node.style.setProperty(
      "--subtle-color",
      `color-mix(in oklab, ${msg.color} 5%, var(--color-neutral-900))`,
    );
    node.style.setProperty(
      "--tint-color",
      `color-mix(in oklab, ${msg.color} 60%, #fff)`,
    );
  }

  private messageHtml(msg: ChatMessage, index: number): string {
    const showUser = !msg.isSamePreviousUser || index === 0;
    const stacked = Boolean(msg.isSamePreviousUser && index > 0);
    const animation =
      this.fadeSeconds > 0
        ? ` style="animation:fadeOut ${FADE_DURATION_MS}ms ${FADE_EASING} forwards ${this.fadeSeconds * 1000 - FADE_DURATION_MS}ms"`
        : "";
    const reply =
      msg.replyTo && msg.replyTo.username
        ? `<div class="chat-reply"><strong>${escapeHtml(msg.replyTo.username)}:</strong> ${escapeHtml(msg.replyTo.message)}</div>`
        : "";
    const badges = msg.badges?.length
      ? `<div class="chat-badges chat-message-user-badges">${msg.badges.map((badge) => `<img class="chat-badge chat-message-badge" src="${escapeHtml(badge.url)}" alt="${escapeHtml(badge.description)}" title="${escapeHtml(badge.description)}" onerror="this.style.opacity='0'" />`).join("")}</div>`
      : "";
    const platformIcon =
      msg.platform === "twitch" ? twitchIcon() : youTubeIcon();
    const userRow = showUser
      ? `<div class="chat-user-row"><div class="chat-user chat-message-user">${
          this.showPlatform
            ? `<span aria-label="${msg.platform}" class="chat-user-platform chat-message-user-platform">${platformIcon}</span>`
            : ""
        }<span class="chat-message-user-name">${escapeHtml(msg.username)}</span></div>${badges}</div>`
      : "";
    const content = renderMarkdown(
      parseMarkdown(msg.message, msg.emotes, msg.replyTo),
    );

    return `<div class="chat-message" data-platform="${msg.platform}"${animation}>${userRow}<div class="chat-bubble${stacked ? " chat-bubble--stacked" : ""} chat-message-text">${reply}<div>${content}</div></div></div>`;
  }

  private get fadeSeconds(): number {
    return Number(this.getAttribute("fade")) || 0;
  }

  private get alignment(): string {
    return this.getAttribute("alignment") || "left";
  }

  private get showPlatform(): boolean {
    return this.getAttribute("show-platform") === "true";
  }

  private get ignoredUsers(): string[] {
    return (this.getAttribute("ignore") || "")
      .split(",")
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean);
  }

  private get notificationSound(): boolean {
    return this.getAttribute("notification-sound") === "true";
  }
}

if (!customElements.get("chat-overlay")) {
  customElements.define("chat-overlay", ChatOverlayElement);
}
