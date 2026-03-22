import type { ChatMessage, MessagePart, UserBadge } from '../types/chat';
import { generateColorFromUsername } from '../utils/color';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const POLLING_INTERVAL_MS = 5000; // YouTube recommends polling every 5 seconds
const MAX_TRIES = 5;

// YouTube author badge types we can map
interface YouTubeAuthorDetails {
  displayName: string;
  profileImageUrl: string;
  channelId: string;
  isVerified?: boolean;
  isChatOwner?: boolean;
  isChatSponsor?: boolean;
  isChatModerator?: boolean;
}

interface YouTubeLiveChatMessage {
  id: string;
  snippet: {
    type: 'textMessageEvent' | 'memberMilestoneChatEvent' | 'superChatEvent' | 'superStickerEvent' | 'membershipGiftingEvent' | 'giftMembershipReceivedEvent';
    liveChatId: string;
    authorChannelId: string;
    publishedAt: string;
    hasDisplayContent: boolean;
    displayMessage: string;
    textMessageDetails?: {
      messageText: string;
    };
  };
  authorDetails: YouTubeAuthorDetails;
}

interface YouTubeLiveChatResponse {
  items: YouTubeLiveChatMessage[];
  nextPageToken: string;
  pollingIntervalMillis: number;
  offlineAt?: string;
  error?: {
    code: number;
    message: string;
  };
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      channelId: string;
      title: string;
      channelTitle: string;
    };
    liveStreamingDetails?: {
      actualStartTime?: string;
      scheduledStartTime?: string;
      concurrentViewers?: string;
      activeLiveChatId?: string;
    };
  }>;
}

// Parse message text into parts (YouTube doesn't have native emotes like Twitch)
function parseYouTubeMessage(message: string): MessagePart[] {
  // For now, treat the entire message as text
  // YouTube messages don't have a structured emote format like Twitch
  // We could add emoji parsing here in the future
  return [{ type: 'text', content: message }];
}

// Convert YouTube message to our ChatMessage format
function convertYouTubeMessage(
  ytMessage: YouTubeLiveChatMessage,
  isSamePreviousUser: boolean
): ChatMessage {
  const { snippet, authorDetails, id } = ytMessage;
  const messageText = snippet.textMessageDetails?.messageText || snippet.displayMessage || '';
  
  // Generate a consistent color for the user
  const color = generateColorFromUsername(authorDetails.displayName);

  // Map YouTube badges to our badge format
  const badges: UserBadge[] = [];
  // if (authorDetails.isChatOwner) {
  //   badges.push({
  //     id: 'broadcaster',
  //     version: '1',
  //     url: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1'
  //   });
  // }
  // if (authorDetails.isChatModerator) {
  //   badges.push({
  //     id: 'moderator',
  //     version: '1',
  //     url: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1'
  //   });
  // }
  // if (authorDetails.isChatSponsor) {
  //   // Using VIP badge for sponsors/members
  //   badges.push({
  //     id: 'vip',
  //     version: '1',
  //     url: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1'
  //   });
  // }
  // if (authorDetails.isVerified) {
  //   // Using partner badge for verified users
  //   badges.push({
  //     id: 'partner',
  //     version: '1',
  //     url: 'https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/1'
  //   });
  // }

  return {
    id,
    username: authorDetails.displayName,
    color,
    parts: parseYouTubeMessage(messageText),
    badges,
    isSamePreviousUser,
    platform: 'youtube',
    timestamp: Date.now(),
  };
}

// Fetch active live stream for a channel
async function fetchLiveStream(
  apiKey: string,
  channelId: string
): Promise<string | null> {
  try {
    // Search for live broadcasts on the channel
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('channelId', channelId);
    searchUrl.searchParams.set('eventType', 'live');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('part', 'id');
    searchUrl.searchParams.set('maxResults', '1');

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API error:', data.error);
      return null;
    }

    if (!data.items || data.items.length === 0) {
      console.warn('No live stream found for channel:', channelId);
      return null;
    }

    return data.items[0].id.videoId;
  } catch (error) {
    console.error('Error fetching live stream:', error);
    return null;
  }
}

// Fetch live chat ID from video
async function fetchLiveChatId(
  apiKey: string,
  videoId: string
): Promise<string | null> {
  try {
    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videoUrl.searchParams.set('key', apiKey);
    videoUrl.searchParams.set('id', videoId);
    videoUrl.searchParams.set('part', 'liveStreamingDetails');

    const response = await fetch(videoUrl.toString());
    const data: YouTubeVideoResponse = await response.json();

    if (data.items && data.items.length > 0) {
      const liveChatId = data.items[0].liveStreamingDetails?.activeLiveChatId;
      if (liveChatId) {
        console.log(`[YouTube] Found live chat ID: ${liveChatId}`);
        return liveChatId;
      }
    }

    console.warn('No active live chat found for video:', videoId);
    return null;
  } catch (error) {
    console.error('Error fetching live chat ID:', error);
    return null;
  }
}

// Poll live chat messages
async function pollLiveChat(
  apiKey: string,
  liveChatId: string,
  pageToken?: string
): Promise<YouTubeLiveChatResponse | null> {
  try {
    const chatUrl = new URL(`${YOUTUBE_API_BASE}/liveChat/messages`);
    chatUrl.searchParams.set('key', apiKey);
    chatUrl.searchParams.set('liveChatId', liveChatId);
    chatUrl.searchParams.set('part', 'snippet,authorDetails');
    chatUrl.searchParams.set('maxResults', '200');
    if (pageToken) {
      chatUrl.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(chatUrl.toString());
    const data: YouTubeLiveChatResponse = await response.json();

    if (data.error) {
      console.error('YouTube Live Chat API error:', data.error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error polling live chat:', error);
    return null;
  }
}

export interface YouTubeChatClient {
  disconnect: () => void;
}

export function createYouTubeClient(
  apiKey: string,
  channelId: string,
  onMessage: (msg: ChatMessage) => void,
  onError?: (error: string) => void
): YouTubeChatClient {
  let isConnected = false;
  let pollTimeout: ReturnType<typeof setTimeout> | null = null;
  let liveChatId: string | null = null;
  let nextPageToken: string | undefined;
  let lastSender: string | null = null;
  let tries: number = MAX_TRIES;

  const stopPolling = () => {
    isConnected = false;
    if (pollTimeout) {
      clearTimeout(pollTimeout);
      pollTimeout = null;
    }
  };

  const startPolling = async () => {
    if (!isConnected || !liveChatId) return;

    const data = await pollLiveChat(apiKey, liveChatId, nextPageToken);

    if (!data) {
      onError?.('Failed to fetch live chat messages');
      // Retry after error
      console.log(`Retrying in ${POLLING_INTERVAL_MS / 1000} secs...`)
      pollTimeout = setTimeout(startPolling, POLLING_INTERVAL_MS);
      return;
    }

    // Check if stream went offline
    if (data.offlineAt) {
      console.log('[YouTube] Stream went offline at:', data.offlineAt);
      onError?.('Stream has ended');
      stopPolling();
      return;
    }

    // Process new messages
    if (data.items && data.items.length > 0) {
      // Filter for text messages only (skip superchats, memberships, etc. for now)
      const textMessages = data.items.filter(
        msg => msg.snippet.type === 'textMessageEvent'
      );

      for (const ytMessage of textMessages) {
        const username = ytMessage.authorDetails.displayName;
        const isSamePreviousUser = lastSender === username;
        lastSender = username;

        const chatMessage = convertYouTubeMessage(ytMessage, isSamePreviousUser);
        onMessage(chatMessage);
      }
    }

    // Update page token for next poll
    nextPageToken = data.nextPageToken;

    // Use the recommended polling interval from the API, or default
    const interval = data.pollingIntervalMillis || POLLING_INTERVAL_MS;

    if (isConnected) {
      pollTimeout = setTimeout(startPolling, interval);
    }
  };

  // Initialize connection
  const initialize = async () => {
    try {
      // Try to get the live stream video ID
      const videoId = await fetchLiveStream(apiKey, channelId);
      
      if (!videoId) {
        throw new Error('No active live stream found for this channel');
      }

      // Get the live chat ID from the video
      liveChatId = await fetchLiveChatId(apiKey, videoId);

      if (!liveChatId) {
        throw new Error('No active live chat found');
      }

      isConnected = true;
      console.log('[YouTube] Connected to live chat');
      
      // Start polling
      startPolling();
    } catch (error) {
      console.error('[YouTube] Initialization error:', error);
      onError?.((error as Error).message || 'Failed to initialize YouTube chat connection');
      // Retry after error
      if (tries > 0) {
        console.log(`Retrying in ${POLLING_INTERVAL_MS / 1000} secs...`)
        pollTimeout = setTimeout(initialize, POLLING_INTERVAL_MS);
        tries--;
      }
    }
  };

  // Start initialization
  initialize();

  return {
    disconnect: () => {
      console.log('[YouTube] Disconnecting from live chat');
      stopPolling();
    },
  };
}

// Helper function to extract channel ID from various YouTube URL formats
export function extractChannelId(input: string): string | null {
  // Direct channel ID
  if (input.startsWith('UC') && input.length === 24) {
    return input;
  }

  // Try to extract from URL
  const patterns = [
    /youtube\.com\/channel\/([UC][\w-]+)/,
    /youtube\.com\/c\/([\w-]+)/,
    /youtube\.com\/user\/([\w-]+)/,
    /youtube\.com\/(@[\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      // For @handles, c/, and user/ URLs, we'd need to resolve to channel ID
      // For now, only channel/ URLs with UC... IDs work directly
      if (match[1].startsWith('UC')) {
        return match[1];
      }
    }
  }

  // Return as-is if it looks like a handle or custom URL
  // Note: The API requires the actual channel ID (UC...), not handles
  return input;
}
