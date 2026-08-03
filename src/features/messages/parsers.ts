import type { ChatUserstate } from "tmi.js";

import type { ChatReplyTo } from "@/types/chat";

import { stvEmotes } from "@/features/emotes/stv-emotes";

const getEmoteImageSrc = (id: string, size: number = 1) =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/${size.toFixed(1)}`;

const getStvEmoteImageSrc = (id: string, size: number = 1) =>
  `https://cdn.7tv.app/emote/${id}/${size}x.avif`;

export const isEmoteImage = (src: string) =>
  src.startsWith("https://static-cdn.jtvnw.net/emoticons/") ||
  src.startsWith("https://cdn.7tv.app/emote/");

export type EmoteProvider = "ttv" | "stv";

interface EmoteBoundary {
  provider: EmoteProvider;
  id: string;
  start: number;
  end: number;
}

export type MessagePart =
  | { type: "text"; content: string }
  | { type: "emote"; id: string; name: string; provider: EmoteProvider };

export function parseMarkdown(
  message: string,
  emotes?: ChatUserstate["emotes"],
  replyTo?: ChatReplyTo,
): string {
  const emoteBoundaries: EmoteBoundary[] = [];

  // Parse Twitch emotes
  if (emotes) {
    for (const [id, positions] of Object.entries(emotes)) {
      for (const position of positions) {
        const [start, end] = position.split("-");
        emoteBoundaries.push({
          provider: "ttv",
          id,
          start: parseInt(start, 10),
          end: parseInt(end, 10),
        });
      }
    }
  }

  // Parse 7TV emotes — find all occurrences of emote names in the message
  if (stvEmotes.length > 0) {
    const messageWords = message.split(" ");
    let end = 0;
    for (let i = 0; i < messageWords.length; i++) {
      const word = messageWords[i];
      const start = end > 0 ? end + 2 : end;
      end = start + word.length - 1;

      const overlaps = emoteBoundaries.some(
        (b) => start < b.end + 1 && end > b.start - 1,
      );
      if (overlaps) continue;

      const stvEmote = stvEmotes.find((e) => e.name === word);
      if (!stvEmote) continue;
      console.log(word, start, end, stvEmote.id);

      emoteBoundaries.push({
        provider: "stv",
        id: stvEmote.id,
        start,
        end,
      });
    }
  }

  // Sort by start position
  emoteBoundaries.sort((a, b) => a.start - b.start);

  // Build message parts
  const parts: MessagePart[] = [];
  let currentPos = 0;

  for (const boundary of emoteBoundaries) {
    if (boundary.start > currentPos) {
      parts.push({
        type: "text",
        content: message.slice(currentPos, boundary.start),
      });
    }
    const emoteName = message.slice(boundary.start, boundary.end + 1);
    parts.push({
      type: "emote",
      id: boundary.id,
      name: emoteName,
      provider: boundary.provider,
    });
    currentPos = boundary.end + 1;
  }

  if (currentPos < message.length) {
    parts.push({ type: "text", content: message.slice(currentPos) });
  }

  // Convert to markdown — resolve via CDN for Twitch and 7TV
  message = parts
    .map((part) =>
      part.type === "emote"
        ? `![${part.name}](${part.provider === "stv" ? getStvEmoteImageSrc(part.id!, 2) : getEmoteImageSrc(part.id!, 2)})`
        : part.content!,
    )
    .join("");

  // Remove reply username prefix
  message =
    replyTo && replyTo.username && replyTo.username !== "Unknown"
      ? message.slice(replyTo.username.length + 1).trim()
      : message;

  // Add codespan to commands that start with "!"
  message = message.replace(/^(![^[\]\s]+)/, "`$1`");

  // Add strong to mentions "@"
  message = message.replace(/(@\S+)/g, "**$1**");

  return message;
}
