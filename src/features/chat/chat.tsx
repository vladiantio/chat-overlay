import { createContext, useContext, useRef } from "react";

import type { ChatMessage } from "@/types/chat";

import { MessageRenderer } from "@/features/messages/message-renderer";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { cn } from "@/utils/cn";

import { TwitchIcon, YouTubeIcon } from "./chat-icons";

type ChatState = {
  alignment: string;
  fadeSeconds: number;
  messages: ChatMessage[];
  showPlatform: boolean;
};

const initialState: ChatState = {
  alignment: "left",
  fadeSeconds: 0,
  messages: [],
  showPlatform: false,
};

export const ChatContext = createContext<ChatState>(initialState);

export const useChat = () => {
  const context = useContext(ChatContext);

  if (context === undefined)
    throw new Error("useChat must be used within a ChatRoot");

  return context;
};

type ChatProviderProps = {
  children: React.ReactNode;
} & Partial<ChatState>;

export const ChatRoot = ({ children, ...value }: ChatProviderProps) => (
  <ChatContext value={{ ...initialState, ...value }}>{children}</ChatContext>
);

export function ChatContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { messages } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(containerRef, [messages]);

  return (
    <div
      className={cn(
        "flex flex-col-reverse overflow-hidden mask-y-from-[calc(100%-var(--spacing)*4)]",
        className,
      )}
      data-slot="chat-container"
      ref={containerRef}
      {...props}
    >
      {children}
    </div>
  );
}

export function ChatMessages() {
  const { alignment, fadeSeconds, messages, showPlatform } = useChat();
  return (
    <div
      className="space-y-4 p-4 leading-[1.4] wrap-anywhere"
      data-slot="chat-messages"
      style={
        {
          "--align": alignment,
        } as React.CSSProperties
      }
    >
      {messages.map((msg, i) => (
        <div
          key={`${msg.platform}-${msg.id}`}
          data-slot="chat-message"
          data-platform={msg.platform}
          className="group relative"
          style={
            {
              "--color": msg.color,
              "--subtle-color":
                "color-mix(in oklab, var(--color) 5%, var(--color-neutral-900))",
              "--tint-color": "color-mix(in oklab, var(--color) 60%, #fff)",
              animation:
                fadeSeconds > 0
                  ? `fadeOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards ${fadeSeconds * 1000 - 250}ms`
                  : undefined,
              transformOrigin:
                "if(style(--align: right): 100% 100%; else: 0 100%)",
            } as React.CSSProperties
          }
        >
          {(!msg.isSamePreviousUser || i == 0) && (
            <div
              className="relative z-1 flex w-fit animate-slide-in items-center gap-2"
              style={
                {
                  marginLeft: "if(style(--align: right): auto; else: 0)",
                  marginRight: "if(style(--align: right): 0; else: auto)",
                  transformOrigin:
                    "if(style(--align: right): 100% 50%; else: 0 50%)",
                } as React.CSSProperties
              }
            >
              <div
                data-slot="chat-message-user"
                className="flex h-8 items-center gap-1.5 rounded-xl bg-(--tint-color) px-2 leading-none font-bold shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                style={
                  {
                    color: "contrast-color(var(--tint-color))",
                  } as React.CSSProperties
                }
              >
                {/* Platform Indicator */}
                {showPlatform && (
                  <span
                    aria-label={msg.platform}
                    data-slot="chat-message-user-platform"
                    className="flex items-center"
                  >
                    {msg.platform === "twitch" ? (
                      <TwitchIcon />
                    ) : (
                      <YouTubeIcon />
                    )}
                  </span>
                )}
                <span data-slot="chat-message-user-name">{msg.username}</span>
              </div>
              {msg.badges && msg.badges.length > 0 && (
                <div
                  className="flex gap-1"
                  data-slot="chat-message-user-badges"
                >
                  {msg.badges.map((badge, index) => (
                    <img
                      data-slot="chat-message-badge"
                      key={`${msg.id}-badge-${index}`}
                      src={badge.url}
                      alt={badge.description}
                      title={badge.description}
                      className="size-8 object-contain drop-shadow-sm drop-shadow-black/30"
                      onError={(e) => {
                        e.currentTarget.style.opacity = "0";
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            data-slot="chat-message-text"
            className={cn(
              "relative w-fit animate-slide-in rounded-xl border bg-(--subtle-color) px-3 py-2 font-medium text-pretty shadow-[0_3px_12px_rgba(0,0,0,0.4)] group-last:ring-2 group-last:ring-(--tint-color)",
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
            {msg.replyTo && (
              <div className="mb-1 line-clamp-1 text-sm leading-snug break-all opacity-65">
                ↪ <strong>{msg.replyTo.username}</strong> {msg.replyTo.message}
              </div>
            )}
            <MessageRenderer message={msg.message} emotes={msg.emotes} />
          </div>
        </div>
      ))}
    </div>
  );
}
