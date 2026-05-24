import { useEffect, useState, useRef } from "react";

import type { ChatMessage } from "@/types/chat";

import { createTwitchClient } from "@/services/twitch";
import { playNotificationSound } from "@/utils/audio";

const MAX_MESSAGES = 10;

export function useTwitchChat(
  channel: string,
  fadeSeconds: number = 0,
  ignoredUsers: string[] = [],
  notificationSound: boolean = false,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // const lastSenderRef = useRef<string | null>(null);
  const connectedRef = useRef(false);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).obsstudio) {
      // Clear messages when scene changes
      window.addEventListener("obsSceneChanged", () => {
        setMessages([]);
        timeouts.forEach(clearTimeout);
      });
    }
    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!channel) return;
    if (connectedRef.current) return;

    connectedRef.current = true;

    const { disconnect } = createTwitchClient(
      channel,
      (msg) => {
        // Ignore messages from ignored users
        if (ignoredUsers.includes(msg.username.toLowerCase())) {
          return;
        }

        // Play notification sound
        if (notificationSound) {
          playNotificationSound();
        }

        setMessages((prevMessages) => {
          // console.log(lastSenderRef.current, msg.username)
          // msg.isSamePreviousUser = lastSenderRef.current === msg.username;
          const newMessages = [...prevMessages, msg];
          // Keep only the last MAX_MESSAGES
          if (newMessages.length > MAX_MESSAGES) {
            return newMessages.slice(newMessages.length - MAX_MESSAGES);
          }
          return newMessages;
        });

        // lastSenderRef.current = msg.username;

        // Schedule removal of the message if fade is enabled
        if (fadeSeconds > 0) {
          const timeout = setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            timeoutsRef.current.delete(timeout);
          }, fadeSeconds * 1000); // Wait until after fade animation

          timeoutsRef.current.add(timeout);
        }
      },
      (deletedMessageId) => {
        // Remove deleted message from chat
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== deletedMessageId),
        );
      },
    );

    return () => {
      connectedRef.current = false;
      disconnect();
    };
  }, [channel, fadeSeconds, ignoredUsers, notificationSound]);

  return { messages };
}
