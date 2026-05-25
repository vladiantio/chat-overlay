import { useMemo } from "react";

import { useTwitchChat } from "@/hooks/useTwitchChat";
import { useYouTubeChat } from "@/hooks/useYouTubeChat";

import { ChatContainer, ChatMessages, ChatRoot } from "./chat";

export function ChatSection({
  twitchChannel,
  youtubeChannel,
  youtubeApiKey,
  fadeSeconds,
  ignoredUsers,
  notificationSound,
  chatAlignment,
  showPlatform,
  ...props
}: {
  twitchChannel: string;
  youtubeChannel: string;
  youtubeApiKey: string;
  fadeSeconds: number;
  ignoredUsers: string[];
  notificationSound: boolean;
  chatAlignment: string;
  showPlatform: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  // Determine which platforms are enabled
  const enableTwitch = Boolean(twitchChannel);
  const enableYouTube = Boolean(youtubeChannel && youtubeApiKey);

  // Connect to Twitch chat
  const { messages: twitchMessages } = useTwitchChat({
    channel: twitchChannel,
    fadeSeconds,
    ignoredUsers,
    notificationSound,
    enabled: enableTwitch,
  });

  // Connect to YouTube chat
  const { messages: youtubeMessages } = useYouTubeChat({
    channelId: youtubeChannel,
    apiKey: youtubeApiKey,
    fadeSeconds,
    ignoredUsers,
    notificationSound,
    enabled: enableYouTube,
  });

  // Merge and sort messages by timestamp
  const allMessages = useMemo(
    () =>
      [...twitchMessages, ...youtubeMessages].toSorted(
        (a, b) => a.timestamp - b.timestamp,
      ),
    [twitchMessages, youtubeMessages],
  );

  return (
    <ChatRoot
      alignment={chatAlignment}
      fadeSeconds={fadeSeconds}
      messages={allMessages}
      showPlatform={showPlatform}
    >
      <ChatContainer {...props}>
        <ChatMessages />
      </ChatContainer>
    </ChatRoot>
  );
}
