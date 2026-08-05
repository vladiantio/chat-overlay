import "@/components/chat-setup";
import "@/features/chat/chat-overlay";

import "./styles/global.css";
import { parseConfig } from "./config";

const config = parseConfig(window.location.search, {
  VITE_CHANNEL: import.meta.env.VITE_CHANNEL,
  VITE_YOUTUBE_CHANNEL_ID: import.meta.env.VITE_YOUTUBE_CHANNEL_ID,
  VITE_YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
  VITE_FADE:
    import.meta.env.VITE_FADE != null ? String(import.meta.env.VITE_FADE) : undefined,
  VITE_IGNORE_USERS: import.meta.env.VITE_IGNORE_USERS,
  VITE_NOTIFICATION_SOUND:
    import.meta.env.VITE_NOTIFICATION_SOUND != null
      ? String(import.meta.env.VITE_NOTIFICATION_SOUND)
      : undefined,
  VITE_CHAT_ALIGNMENT: import.meta.env.VITE_CHAT_ALIGNMENT,
});

const root = document.getElementById("root")!;

if (!config.twitchChannel && !config.youtubeChannel) {
  const setup = document.createElement("chat-setup");
  root.append(setup);
} else {
  const overlay = document.createElement("chat-overlay");
  if (config.twitchChannel) overlay.setAttribute("twitch", config.twitchChannel);
  if (config.youtubeChannel) {
    overlay.setAttribute("youtube", config.youtubeChannel);
    if (config.youtubeApiKey)
      overlay.setAttribute("youtube-key", config.youtubeApiKey);
  }
  if (config.fadeSeconds > 0) overlay.setAttribute("fade", String(config.fadeSeconds));
  overlay.setAttribute("alignment", config.chatAlignment);
  if (config.showPlatform) overlay.setAttribute("show-platform", "true");
  if (config.ignoredUsers.length > 0)
    overlay.setAttribute("ignore", config.ignoredUsers.join(","));
  if (config.notificationSound) overlay.setAttribute("notification-sound", "true");
  root.append(overlay);
}
