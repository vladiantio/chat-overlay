import type { ChatMessage } from "@/types/chat";

export const MAX_MESSAGES = 10;

/**
 * Single source of truth for chat messages. Platform controllers push
 * messages in; subscribers listen for "change" CustomEvents.
 */
export class ChatController extends EventTarget {
  private items: ChatMessage[] = [];

  get messages(): readonly ChatMessage[] {
    return this.items;
  }

  add(message: ChatMessage) {
    const index = this.items.findIndex(
      (existing) => existing.timestamp > message.timestamp,
    );
    if (index === -1) this.items.push(message);
    else this.items.splice(index, 0, message);
    this.dispatchChange();
  }

  removeById(id: string) {
    const index = this.items.findIndex((message) => message.id === id);
    if (index === -1) return;
    this.items.splice(index, 1);
    this.dispatchChange();
  }

  clear() {
    if (this.items.length === 0) return;
    this.items = [];
    this.dispatchChange();
  }

  private dispatchChange() {
    this.dispatchEvent(new CustomEvent("change"));
  }
}
