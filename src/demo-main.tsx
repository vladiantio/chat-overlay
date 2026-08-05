import { createRoot } from "react-dom/client";

import "./styles/global.css";
import { ChatContainer, ChatMessages, ChatRoot } from "@/features/chat/chat";
import type { ChatMessage } from "@/types/chat";

const params = new URLSearchParams(location.search);
const alignment = params.get("align") ?? "left";
const fade = Number(params.get("fade")) || 0;

const badge = (id: string, version: string, description: string, url: string) => ({
  id,
  version,
  description,
  url,
});

const demoMessages: ChatMessage[] = [
  {
    id: "m1",
    platform: "twitch",
    username: "vladiantio",
    color: "#8b5cf6",
    timestamp: 1,
    badges: [
      badge(
        "broadcaster",
        "1",
        "Broadcaster",
        "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
      ),
    ],
    message: "Welcome to the stream! Check out the **schedule** below:",
  },
  {
    id: "m2",
    platform: "twitch",
    username: "vladiantio",
    color: "#8b5cf6",
    timestamp: 2,
    isSamePreviousUser: true,
    replyTo: { id: "m1", username: "vladiantio", message: "Welcome to the stream!" },
    message: "@vladiantio !uptime Kappa",
    emotes: { "25": ["18-22"] },
  },
  {
    id: "m3",
    platform: "twitch",
    username: "pogchamp_fan",
    color: "#e02b2b",
    timestamp: 3,
    badges: [
      badge(
        "moderator",
        "1",
        "Moderator",
        "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2",
      ),
      badge(
        "subscriber",
        "0",
        "Subscriber",
        "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
      ),
    ],
    message: "## Schedule\n\n> Monday: ranked grind\n\nNice play @vladiantio `!follow`",
  },
  {
    id: "m4",
    platform: "youtube",
    username: "youtube_viewer",
    color: "#ff5c5c",
    timestamp: 4,
    badges: [],
    message: "HUH Cheese",
  },
  {
    id: "m5",
    platform: "twitch",
    username: "emote_only",
    color: "#00b8ff",
    timestamp: 5,
    message: "PogChamp",
    emotes: { "305954156": ["0-7"] },
  },
];

createRoot(document.getElementById("root")!).render(
  <ChatRoot
    alignment={alignment}
    fadeSeconds={fade}
    messages={demoMessages}
    showPlatform
  >
    <ChatContainer className="chat-screen">
      <ChatMessages />
    </ChatContainer>
  </ChatRoot>,
);
