import type { ChatUserstate } from "tmi.js";

export type Platform = "twitch" | "youtube";

export interface UserBadge {
  id: string;
  version: string;
  description: string;
  url: string;
}

export interface ChatReplyTo {
  id: string;
  username: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  color: string;
  badges?: UserBadge[];
  message: string;
  emotes?: ChatUserstate["emotes"];
  isSamePreviousUser?: boolean;
  platform: Platform;
  timestamp: number;
  replyTo?: ChatReplyTo;
}
