import type { ChatMessage } from "@/types/chat";

import { TwitchIcon, YouTubeIcon } from "./chat-icons";

type OgChatPreviewProps = {
  messages: ChatMessage[];
  alignment?: "left" | "right";
  showPlatform?: boolean;
};

const borderColor = "#ffffff1a";

function parseHex(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function contrastText(r: number, g: number, b: number) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#ffffff";
}

function messageColors(color: string) {
  const base = parseHex(color);
  const tintRgb = {
    r: Math.round(base.r * 0.4 + 255 * 0.6),
    g: Math.round(base.g * 0.4 + 255 * 0.6),
    b: Math.round(base.b * 0.4 + 255 * 0.6),
  };
  const subtleRgb = {
    r: Math.round(base.r * 0.05 + 23 * 0.95),
    g: Math.round(base.g * 0.05 + 23 * 0.95),
    b: Math.round(base.b * 0.05 + 23 * 0.95),
  };
  return {
    tint: `rgb(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b})`,
    subtle: `rgb(${subtleRgb.r}, ${subtleRgb.g}, ${subtleRgb.b})`,
    textOnTint: contrastText(tintRgb.r, tintRgb.g, tintRgb.b),
  };
}

export function OgChatPreview({
  messages,
  alignment = "left",
  showPlatform = false,
}: OgChatPreviewProps) {
  const alignEnd = alignment === "right";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        fontFamily: "Figtree",
        fontSize: 18,
        lineHeight: 1.4,
        width: "100%",
      }}
    >
      {messages.map((msg, index) => {
        const { tint, subtle, textOnTint } = messageColors(msg.color);
        const showUser = !msg.isSamePreviousUser || index === 0;

        return (
          <div
            key={`${msg.platform}-${msg.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: alignEnd ? "flex-end" : "flex-start",
              gap: 4,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                marginTop: showUser ? 28 : -12,
                padding: "8px 12px",
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                backgroundColor: subtle,
                color: "#f5f5f5",
                fontWeight: 500,
                boxShadow: [
                  index === messages.length - 1 && `0 0 0 2px ${tint}`,
                  "0 3px 12px rgba(0,0,0,0.4)",
                ]
                  .filter((s) => s)
                  .join(", "),
              }}
            >
              {msg.replyTo && (
                <div
                  style={{
                    display: "flex",
                    marginBottom: 4,
                    fontSize: 15,
                    opacity: 0.65,
                    lineHeight: 1.3,
                    overflow: "hidden",
                  }}
                >
                  ↪ <strong>{msg.replyTo.username}</strong>{" "}
                  {msg.replyTo.message}
                </div>
              )}
              {msg.message}
            </div>
            {showUser && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 12,
                  backgroundColor: tint,
                  color: textOnTint,
                  fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  position: "absolute",
                }}
              >
                {showPlatform && (
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {msg.platform === "twitch" ? (
                      <TwitchIcon size={24} />
                    ) : (
                      <YouTubeIcon size={24} />
                    )}
                  </span>
                )}
                {msg.badges?.map((badge, badgeIndex) => (
                  <img
                    key={`${msg.id}-badge-${badgeIndex}`}
                    src={badge.url}
                    alt={badge.description}
                    width={24}
                    height={24}
                  />
                ))}
                <span>{msg.username}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
