import fs from "node:fs/promises";
import satori, { type Font } from "satori";
import sharp from "sharp";

import type { ChatMessage } from "./types/chat";

import { OgChatPreview } from "./features/chat/chat-og";

const OG_PATH = "./public/og.jpg";

const FONT_PATH = "./src/assets/fonts";

const messages: ChatMessage[] = [
  {
    id: "1",
    username: "juan",
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

// Helper to get Unicode code point
function getIconCode(emoji: string) {
  const codePoints = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");
  return codePoints;
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function OG() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        width: 1080,
        height: 567,
        padding: 60,
      }}
    >
      <div
        style={{
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
        }}
      >
        <div
          style={{
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
          }}
        >
          <p
            style={{
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            Chat Overlay
          </p>
          <p>A sleek chat overlay for OBS Studio</p>
        </div>
        <div
          style={{
            display: "block",
            width: 1,
            height: "100%",
            backgroundColor: "#ffffff20",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "24px 48px",
            height: "100%",
          }}
        >
          <OgChatPreview messages={messages} />
        </div>
      </div>
    </div>
  );
}

try {
  if (await fileExists(OG_PATH)) {
    if (process.argv.includes("--force")) {
      console.log("✔ Forcing overwrite...");
    } else {
      console.log(`✔ File already exists: ${OG_PATH}. Overwrite using --force`);
      process.exit(0);
    }
  }

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

  const svg = await satori(<OG />, {
    width: 1080,
    height: 567,
    fonts,
    loadAdditionalAsset: async (code, text) => {
      if (code === "emoji") {
        const codePoint = getIconCode(text);
        // Fetch from Twemoji CDN
        const response = await fetch(
          `https://cdnjs.cloudflare.com/ajax/libs/twemoji/16.0.1/svg/${codePoint.toLowerCase()}.svg`,
        );
        const svgText = await response.text();
        // Return as base64 data URI
        return `data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`;
      }
      return "";
    },
  });

  const imgBuffer = await sharp(Buffer.from(svg))
    .jpeg({ mozjpeg: true, progressive: true, quality: 90 })
    .toBuffer();

  await fs.writeFile(OG_PATH, imgBuffer);
  console.log(`✔ Wrote ${OG_PATH}`);
} catch (err) {
  console.error("✖ Error:", (err as Error).message);
  process.exit(1);
}
