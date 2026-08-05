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
      className={cn("chat-container", className)}
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
      className="chat-messages"
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
          className="chat-message"
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
              className="chat-user-row"
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
                className="chat-user"
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
                    className="chat-user-platform"
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
                <div className="chat-badges" data-slot="chat-message-user-badges">
                  {msg.badges.map((badge, index) => (
                    <img
                      data-slot="chat-message-badge"
                      key={`${msg.id}-badge-${index}`}
                      src={badge.url}
                      alt={badge.description}
                      title={badge.description}
                      className="chat-badge"
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
              "chat-bubble",
              msg.isSamePreviousUser && i > 0 && "chat-bubble--stacked",
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
              <div className="chat-reply">
                <strong>{msg.replyTo.username}:</strong> {msg.replyTo.message}
              </div>
            )}
            <MessageRenderer
              message={msg.message}
              emotes={msg.emotes}
              replyTo={msg.replyTo}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
