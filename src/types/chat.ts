export type MessagePart = 
  | { type: 'text'; content: string }
  | { type: 'emote'; id: string; name: string };

export interface UserBadge {
  id: string;
  version: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  color: string;
  badges: UserBadge[];
  parts: MessagePart[];
  isSamePreviousUser?: boolean;
}
