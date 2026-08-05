export interface OverlayConfig {
  twitchChannel: string;
  youtubeChannel: string;
  youtubeApiKey: string;
  fadeSeconds: number;
  ignoredUsers: string[];
  notificationSound: boolean;
  chatAlignment: string;
  showPlatform: boolean;
}

/**
 * Parse overlay configuration from URL query params, falling back to env
 * vars. URL params take precedence over env values.
 */
export function parseConfig(
  url: string,
  env: Record<string, string | undefined> = {},
): OverlayConfig {
  const urlParams = new URLSearchParams(url);

  const twitchChannel =
    urlParams.get("twitch")?.toLowerCase() || env.VITE_CHANNEL || "";
  const youtubeChannel =
    urlParams.get("youtube") || env.VITE_YOUTUBE_CHANNEL_ID || "";
  const youtubeApiKey =
    urlParams.get("youtubeKey") || env.VITE_YOUTUBE_API_KEY || "";
  const fadeSeconds =
    Number(urlParams.get("fade")) || Number(env.VITE_FADE) || 0;
  const ignoreParam =
    urlParams.get("ignore") || env.VITE_IGNORE_USERS || "";
  const chatAlignment =
    urlParams.get("chatAlignment") || env.VITE_CHAT_ALIGNMENT || "left";
  const notificationSound = Boolean(
    Number(
      urlParams.has("notificationSound")
        ? urlParams.get("notificationSound")
        : env.VITE_NOTIFICATION_SOUND,
    ),
  );

  const ignoredUsers = ignoreParam
    ? ignoreParam.split(",").map((user) => user.trim().toLowerCase())
    : [];

  const enableTwitch = Boolean(twitchChannel);
  const enableYouTube = Boolean(youtubeChannel && youtubeApiKey);

  return {
    twitchChannel,
    youtubeChannel,
    youtubeApiKey,
    fadeSeconds,
    ignoredUsers,
    notificationSound,
    chatAlignment,
    showPlatform: enableTwitch && enableYouTube,
  };
}
