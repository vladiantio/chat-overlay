import type { ChatUserstate } from "tmi.js";

import type { MessagePart } from "@/types/chat";

const getEmoteImageSrc = (id: string) =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;

export const parseEmoteImageSrcSet = (src: string) => {
  if (!src.startsWith("https://static-cdn.jtvnw.net/emoticons/v2/"))
    return undefined;
  return `${src} 1x, ${src.slice(0, -4)}/2.0 2x, ${src.slice(0, -4)}/3.0 4x`;
};

export function parseMarkdown(
  message: string,
  emotes?: ChatUserstate["emotes"],
): string {
  if (!emotes) {
    return message;
  }

  // Parse emotes object into a flat, sorted array of boundaries
  const emoteBoundaries: { id: string; start: number; end: number }[] = [];

  for (const [id, positions] of Object.entries(emotes)) {
    for (const position of positions) {
      const [start, end] = position.split("-");
      emoteBoundaries.push({
        id,
        start: parseInt(start, 10),
        end: parseInt(end, 10),
      });
    }
  }

  // Sort them so we can process the string sequentially
  emoteBoundaries.sort((a, b) => a.start - b.start);

  const parts: MessagePart[] = [];
  let currentPos = 0;

  for (const boundary of emoteBoundaries) {
    // If there's text before the emote, push it
    if (boundary.start > currentPos) {
      const textChunk = message.slice(currentPos, boundary.start);
      parts.push({ type: "text", content: textChunk });
    }

    // Push the emote itself
    const emoteName = message.slice(boundary.start, boundary.end + 1);
    parts.push({ type: "emote", id: boundary.id, name: emoteName });

    currentPos = boundary.end + 1;
  }

  // If there's trailing text after the last emote, push it
  if (currentPos < message.length) {
    const textChunk = message.slice(currentPos);
    parts.push({ type: "text", content: textChunk });
  }

  return parts
    .map((part) =>
      part.type === "emote"
        ? `![${part.name}](${getEmoteImageSrc(part.id)})`
        : part.content,
    )
    .join("");
}
