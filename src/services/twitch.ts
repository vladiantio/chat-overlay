import tmi from 'tmi.js';
import { parseEmotes } from '../utils/emotes';
import { parseBadges } from '../utils/badges';
import type { ChatMessage } from '../types/chat';

const FALLBACK_COLOR = '#3fa0fa';
const FALLBACK_USERNAME = 'Anonymous';

export function createTwitchClient(channel: string, onMessage: (msg: ChatMessage) => void) {
  let lastSender: string | null = null
  const client = new tmi.Client({
    connection: {
      reconnect: true,
      secure: true,
    },
    channels: [channel],
  });

  client.connect().catch(console.error);

  client.on('message', (_channelName, tags, message, self) => {
    if (self) return;

    const username = tags['display-name'] || tags.username || FALLBACK_USERNAME;
    const color = tags.color || FALLBACK_COLOR;
    const messageId = tags.id || Math.random().toString(36).substring(2, 9);
    
    const parts = parseEmotes(message, tags.emotes);
    const badges = parseBadges(tags.badges);
    const isSamePreviousUser = lastSender === username;
    lastSender = username;

    console.log(username);

    onMessage({ id: messageId, username, color, parts, badges, isSamePreviousUser });
  });

  return {
    disconnect: () => {
      client.removeAllListeners();
      client.disconnect();
    },
  };
}
