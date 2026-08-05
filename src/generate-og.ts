import fs from "node:fs/promises";
import { render, type Font, type Node } from "takumi-js";

import type { ChatMessage } from "./types/chat";

import { ogChatPreviewNode } from "./features/chat/chat-og";

const OG_PATH = "./public/og.jpg";

const FONT_PATH = "./src/assets/fonts";

const messages: ChatMessage[] = [
  {
    id: "1",
    username: "qwerty",
    color: "#D30040",
    message: "hello",
    isSamePreviousUser: false,
    platform: "twitch",
    timestamp: 1,
  },
  {
    id: "2",
    username: "xyz",
    color: "#DAA520",
    message: "hello there 👋",
    isSamePreviousUser: false,
    platform: "twitch",
    timestamp: 2,
  },
  {
    id: "3",
    username: "xyz",
    color: "#DAA520",
    message: "what's up?",
    isSamePreviousUser: true,
    platform: "twitch",
    timestamp: 3,
  },
  {
    id: "4",
    username: "abcde",
    color: "#5B99FF",
    message: "not much, you?",
    isSamePreviousUser: false,
    platform: "twitch",
    timestamp: 4,
  },
  {
    id: "5",
    username: "fghij",
    color: "#0099FF",
    message: "thanks for the help!",
    isSamePreviousUser: false,
    platform: "twitch",
    timestamp: 5,
  },
];

const ogNode: Node = {
  type: "container",
  style: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0a0a0a",
    width: 1080,
    height: 567,
    padding: 60,
  },
  children: [
    {
      type: "container",
      style: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        fontFamily: "Figtree",
        border: "1px solid #ffffff20",
        borderRadius: 24,
        padding: 0,
        overflow: "hidden",
        width: "100%",
        height: "100%",
      },
      children: [
        {
          type: "container",
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "24px 48px",
            alignItems: "flex-end",
            justifyContent: "center",
            flex: 1,
            fontSize: 32,
            color: "#fafafa",
            textAlign: "right",
            height: "100%",
          },
          children: [
            {
              type: "text",
              text: "Chat Overlay",
              style: { fontSize: 48, fontWeight: 700, marginBottom: 32 },
            },
            {
              type: "text",
              text: "A sleek chat overlay for OBS Studio",
              style: { marginTop: 32 },
            },
          ],
        },
        {
          type: "container",
          style: {
            display: "block",
            width: 1,
            height: "100%",
            backgroundColor: "#ffffff20",
          },
        },
        {
          type: "container",
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "24px 48px",
            height: "100%",
          },
          children: [ogChatPreviewNode(messages)],
        },
      ],
    },
  ],
};

console.log("* Generating OG...");

const fonts: Font[] = [
  {
    name: "Figtree",
    data: await fs.readFile(`${FONT_PATH}/Figtree-Regular.ttf`),
    weight: 400,
  },
  {
    name: "Figtree",
    data: await fs.readFile(`${FONT_PATH}/Figtree-Bold.ttf`),
    weight: 700,
  },
];

const jpeg = await render(ogNode, {
  width: 1080,
  height: 567,
  format: "jpeg",
  quality: 90,
  fonts,
});

await fs.writeFile(OG_PATH, jpeg);
console.log(`✔ Wrote ${OG_PATH} (${jpeg.length} bytes)`);
