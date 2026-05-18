import tmi from "tmi.js";

import type { ChatMessage } from "@/types/chat";

import { parseBadges } from "@/features/badges/parse-badges";
import { generateColorFromUsername } from "@/utils/color";

const FALLBACK_USERNAME = "Anonymous";

export function createTwitchClient(
  channel: string,
  onMessage: (msg: ChatMessage) => void,
  onDeleted: (deletedMessageId: string) => void,
) {
  let lastSender: string | null = null;
  const client = new tmi.Client({
    connection: {
      reconnect: true,
      secure: true,
    },
    channels: [channel],
  });

  client.connect().catch(console.error);

  client.on("message", (_channelName, tags, message, self) => {
    if (self) return;

    const username = tags["display-name"] || tags.username || FALLBACK_USERNAME;
    const color = tags.color || generateColorFromUsername(username);
    const messageId = tags.id || Math.random().toString(36).substring(2, 9);

    const badges = parseBadges(tags.badges);
    const isSamePreviousUser = lastSender === username;
    lastSender = username;

    onMessage({
      id: messageId,
      username,
      color,
      message,
      emotes: tags.emotes,
      badges,
      isSamePreviousUser,
      platform: "twitch",
      timestamp: Date.now(),
    });
  });

  client.on(
    "messagedeleted",
    (_channel, _username, _deletedMessage, userstate) => {
      const deletedMessageId = userstate["target-msg-id"];
      if (deletedMessageId) {
        onDeleted(deletedMessageId);
      }
    },
  );

  return {
    disconnect: () => {
      client.removeAllListeners();
      client.disconnect();
    },
  };
}
