import { useEffect, useState, useRef } from "react";

import type { ChatMessage } from "@/types/chat";

import { createYouTubeClient, extractChannelId } from "@/services/youtube";
import { playNotificationSound } from "@/utils/audio";

const MAX_MESSAGES = 10;

export function useYouTubeChat({
  channelId,
  apiKey,
  fadeSeconds = 0,
  ignoredUsers = [],
  notificationSound = true,
  enabled = true,
}: {
  channelId: string;
  apiKey: string;
  fadeSeconds: number;
  ignoredUsers: string[];
  notificationSound: boolean;
  enabled: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connectedRef = useRef(false);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear error and messages when channel changes
  useEffect(() => {
    setError(null);
    setMessages([]);
  }, [channelId, apiKey]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !channelId || !apiKey) return;
    if (connectedRef.current) return;

    // Validate and extract channel ID
    const extractedChannelId = extractChannelId(channelId);
    if (!extractedChannelId) {
      setError("Invalid YouTube channel ID or URL");
      return;
    }

    connectedRef.current = true;
    setError(null);

    const { disconnect } = createYouTubeClient(
      apiKey,
      extractedChannelId,
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
          const newMessages = [...prevMessages, msg];
          // Keep only the last MAX_MESSAGES
          if (newMessages.length > MAX_MESSAGES) {
            return newMessages.slice(newMessages.length - MAX_MESSAGES);
          }
          return newMessages;
        });

        // Schedule removal of the message if fade is enabled
        if (fadeSeconds > 0) {
          const timeout = setTimeout(
            () => {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
              timeoutsRef.current.delete(timeout);
            },
            fadeSeconds * 1000 + 1000,
          ); // Wait until after fade animation

          timeoutsRef.current.add(timeout);
        }
      },
      (err) => {
        console.error("[YouTube Chat Error]:", err);
        setError(err);
      },
    );

    return () => {
      connectedRef.current = false;
      disconnect();
    };
  }, [
    channelId,
    apiKey,
    fadeSeconds,
    ignoredUsers,
    notificationSound,
    enabled,
  ]);

  return { messages, error };
}
