import { describe, expect, it } from "vitest";

import type { ChatReplyTo } from "@/types/chat";

import { parseMarkdown } from "./parsers";

const twitchEmoteSrc = (id: string) =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;

describe("parseMarkdown", () => {
  it("replaces Twitch emotes with markdown images", () => {
    const out = parseMarkdown("PogChamp check", {
      "305954156": ["0-7"],
    });
    expect(out).toBe(`![PogChamp](${twitchEmoteSrc("305954156")}) check`);
  });

  it("replaces 7TV emotes with markdown images", () => {
    const out = parseMarkdown("HUH cheese");
    expect(out).toMatch(
      /^!\[HUH\]\(https:\/\/cdn\.7tv\.app\/emote\/[^/]+\/2x\.avif\) cheese$/,
    );
  });

  it("skips 7TV substitution when the word overlaps a Twitch emote", () => {
    const out = parseMarkdown("HUH!", {
      "305954156": ["0-2"],
    });
    expect(out).toBe(`![HUH](${twitchEmoteSrc("305954156")})!`);
  });

  it("strips the reply username prefix", () => {
    const replyTo: ChatReplyTo = {
      id: "m1",
      username: "vladiantio",
      message: "Welcome!",
    };
    expect(parseMarkdown("@vladiantio thanks", undefined, replyTo)).toBe(
      "thanks",
    );
  });

  it("does not strip the prefix when the reply username is Unknown", () => {
    const replyTo: ChatReplyTo = {
      id: "m1",
      username: "Unknown",
      message: "",
    };
    expect(parseMarkdown("@vladiantio thanks", undefined, replyTo)).toBe(
      "**@vladiantio** thanks",
    );
  });

  it("wraps a leading !command in a codespan", () => {
    expect(parseMarkdown("!uptime")).toBe("`!uptime`");
  });

  it("does not wrap a mid-message !command", () => {
    expect(parseMarkdown("nice !follow")).toBe("nice !follow");
  });

  it("bolds @mentions", () => {
    expect(parseMarkdown("thanks @vladiantio")).toBe(
      "thanks **@vladiantio**",
    );
  });

  it("combines reply strip, codespan, and mention bold", () => {
    const replyTo: ChatReplyTo = {
      id: "m1",
      username: "vladiantio",
      message: "Welcome!",
    };
    expect(
      parseMarkdown("@vladiantio !uptime @pogchamp_fan", undefined, replyTo),
    ).toBe("`!uptime` **@pogchamp_fan**");
  });
});
