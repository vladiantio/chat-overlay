import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";

const env = {
  VITE_CHANNEL: "envchannel",
  VITE_YOUTUBE_CHANNEL_ID: "UCEnvChannel",
  VITE_YOUTUBE_API_KEY: "env-key",
  VITE_FADE: "60",
  VITE_IGNORE_USERS: "envuser1, envuser2",
  VITE_NOTIFICATION_SOUND: "1",
  VITE_CHAT_ALIGNMENT: "right",
};

describe("parseConfig", () => {
  it("falls back to env vars when no URL params are present", () => {
    expect(parseConfig("", env)).toEqual({
      twitchChannel: "envchannel",
      youtubeChannel: "UCEnvChannel",
      youtubeApiKey: "env-key",
      fadeSeconds: 60,
      ignoredUsers: ["envuser1", "envuser2"],
      notificationSound: true,
      chatAlignment: "right",
      showPlatform: true,
    });
  });

  it("prefers URL params over env vars", () => {
    const config = parseConfig(
      "?twitch=URLChannel&youtube=UCUrlChannel&youtubeKey=url-key&fade=120&ignore=user1,user2&chatAlignment=left&notificationSound=0",
      env,
    );
    expect(config.twitchChannel).toBe("urlchannel");
    expect(config.youtubeChannel).toBe("UCUrlChannel");
    expect(config.youtubeApiKey).toBe("url-key");
    expect(config.fadeSeconds).toBe(120);
    expect(config.ignoredUsers).toEqual(["user1", "user2"]);
    expect(config.chatAlignment).toBe("left");
    expect(config.notificationSound).toBe(false);
  });

  it("lowercases the twitch channel from the URL", () => {
    expect(parseConfig("?twitch=MyChannel", {}).twitchChannel).toBe(
      "mychannel",
    );
  });

  it("trims and lowercases the ignore list", () => {
    expect(parseConfig("?ignore=User1, user2,User3", {}).ignoredUsers).toEqual(
      ["user1", "user2", "user3"],
    );
  });

  it("returns an empty ignore list when not configured", () => {
    expect(parseConfig("", {}).ignoredUsers).toEqual([]);
  });

  it("defaults fade to 0 when absent and invalid", () => {
    expect(parseConfig("", {}).fadeSeconds).toBe(0);
    expect(parseConfig("?fade=abc", {}).fadeSeconds).toBe(0);
  });

  it("defaults alignment to left", () => {
    expect(parseConfig("", {}).chatAlignment).toBe("left");
  });

  it("defaults notificationSound to false", () => {
    expect(parseConfig("", {}).notificationSound).toBe(false);
    expect(parseConfig("?notificationSound=0", {}).notificationSound).toBe(
      false,
    );
  });

  it("shows platform indicators only when both platforms are enabled", () => {
    expect(parseConfig("?twitch=ch", {}).showPlatform).toBe(false);
    expect(parseConfig("?youtube=UCx&youtubeKey=k", {}).showPlatform).toBe(
      false,
    );
    expect(
      parseConfig("?twitch=ch&youtube=UCx&youtubeKey=k", {}).showPlatform,
    ).toBe(true);
  });
});
