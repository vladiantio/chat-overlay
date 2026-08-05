import type { ChatUserstate } from "tmi.js";

import type { ChatReplyTo } from "@/types/chat";

import { parseMarkdown } from "./parsers";
import { renderMarkdown } from "./message-renderer";

interface MessageRendererProps {
  message: string;
  emotes?: ChatUserstate["emotes"];
  replyTo?: ChatReplyTo;
}

export function MessageRenderer({ message, emotes, replyTo }: MessageRendererProps) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: renderMarkdown(parseMarkdown(message, emotes, replyTo)),
      }}
    />
  );
}
