import { useMemo, useRef } from "react";

import type { ChatMessage } from "@/types/chat";

import { MessageRenderer } from "@/features/messages/message-renderer";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useTwitchChat } from "@/hooks/useTwitchChat";
import { useYouTubeChat } from "@/hooks/useYouTubeChat";
import { cn } from "@/utils/cn";

// Platform icons
export const TwitchIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

export const YouTubeIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export function Chat({
  twitchChannel,
  youtubeChannel,
  youtubeApiKey,
  fade,
  ignoredUsers,
  notificationSound,
  chatAlignment,
  showPlatform,
}: {
  twitchChannel: string;
  youtubeChannel: string;
  youtubeApiKey: string;
  fade: number;
  ignoredUsers: string[];
  notificationSound: boolean;
  chatAlignment: string;
  showPlatform: boolean;
}) {
  // Determine which platforms are enabled
  const enableTwitch = Boolean(twitchChannel);
  const enableYouTube = Boolean(youtubeChannel && youtubeApiKey);

  // Connect to Twitch chat
  const { messages: twitchMessages } = useTwitchChat(
    twitchChannel,
    fade,
    ignoredUsers,
    notificationSound,
  );

  // Connect to YouTube chat
  const { messages: youtubeMessages } = useYouTubeChat(
    youtubeChannel,
    youtubeApiKey,
    fade,
    ignoredUsers,
    notificationSound,
    enableYouTube,
  );

  // Merge and sort messages by timestamp (using message ID as proxy for order)
  const allMessages = useMemo(() => {
    const messages: ChatMessage[] = [];

    if (enableTwitch) {
      messages.push(...twitchMessages);
    }
    if (enableYouTube) {
      messages.push(...youtubeMessages);
    }

    // Sort by timestamp
    // Messages from the same array are already ordered, so we just interleave them
    return messages.toSorted((a, b) => a.timestamp - b.timestamp);
  }, [twitchMessages, youtubeMessages, enableTwitch, enableYouTube]);

  // Handle auto-scroll to bottom of chat
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(chatContainerRef, [allMessages]);

  return (
    <div
      className="flex h-dvh flex-col-reverse overflow-hidden mask-y-from-[calc(100%-var(--spacing)*4)]"
      ref={chatContainerRef}
    >
      <div
        className="space-y-4 p-4 leading-[1.4] wrap-break-word"
        data-slot="chat-container"
        style={
          {
            "--align": chatAlignment,
          } as React.CSSProperties
        }
      >
        {allMessages.map((msg, i) => (
          <div
            key={`${msg.platform}-${msg.id}`}
            data-slot="chat-message"
            data-platform={msg.platform}
            className="group relative"
            style={
              {
                "--color": msg.color,
                "--subtle-color":
                  "color-mix(in oklab, var(--color) 10%, var(--color-neutral-900))",
                "--tint-color": "color-mix(in oklab, var(--color) 60%, #fff)",
                animation:
                  fade > 0
                    ? `fadeOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards ${fade * 1000 - 250}ms`
                    : undefined,
                transformOrigin:
                  "if(style(--align: right): 100% 100%; else: 0 100%)",
              } as React.CSSProperties
            }
          >
            {(!msg.isSamePreviousUser || i == 0) && (
              <div
                data-slot="chat-message-user"
                className="relative z-1 flex w-fit animate-slide-in items-center rounded-xl bg-(--tint-color) pr-1 font-bold shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                style={
                  {
                    color: "contrast-color(var(--tint-color))",
                    marginLeft: "if(style(--align: right): auto; else: 0)",
                    marginRight: "if(style(--align: right): 0; else: auto)",
                    transformOrigin:
                      "if(style(--align: right): 100% 50%; else: 0 50%)",
                  } as React.CSSProperties
                }
              >
                {/* Platform Indicator */}
                {showPlatform && (
                  <span
                    aria-label={msg.platform}
                    data-slot="chat-message-user-platform"
                    className="flex items-center p-1.5"
                  >
                    {msg.platform === "twitch" ? (
                      <TwitchIcon />
                    ) : (
                      <YouTubeIcon />
                    )}
                  </span>
                )}

                {msg.badges && msg.badges.length > 0 && (
                  <span
                    data-slot="chat-message-user-badges"
                    className="flex items-center gap-1 pr-1.5"
                  >
                    {msg.badges.map((badge, index) => (
                      <img
                        data-slot="chat-message-badge"
                        key={`${msg.id}-badge-${index}`}
                        src={badge.url}
                        alt={badge.description}
                        title={badge.description}
                        className="size-[24px] drop-shadow-sm drop-shadow-black/30"
                        onError={(e) => {
                          e.currentTarget.style.opacity = "0";
                        }}
                      />
                    ))}
                  </span>
                )}
                <span data-slot="chat-message-user-name" className="pr-1.5">
                  {msg.username}
                </span>
              </div>
            )}

            <div
              data-slot="chat-message-text"
              className={cn(
                "relative w-fit animate-slide-in rounded-xl bg-(--subtle-color) px-3 py-2 font-medium text-pretty shadow-[0_3px_12px_rgba(0,0,0,0.4)] group-last:ring-2 group-last:ring-(--tint-color)",
                msg.isSamePreviousUser && i > 0 ? "-mt-3" : "-mt-1",
              )}
              style={
                {
                  marginLeft: "if(style(--align: right): auto; else: 0)",
                  marginRight: "if(style(--align: right): 0; else: auto)",
                  transformOrigin:
                    "if(style(--align: right): 100% 100%; else: 0 100%)",
                } as React.CSSProperties
              }
            >
              <MessageRenderer message={msg.message} emotes={msg.emotes} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
