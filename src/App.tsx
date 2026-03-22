import { Chat } from './components/chat';
import { Setup } from './components/setup';

const CHANNEL = import.meta.env.VITE_CHANNEL;
const YOUTUBE_CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const FADE = import.meta.env.VITE_FADE;
const IGNORE_USERS = import.meta.env.VITE_IGNORE_USERS;
const NOTIFICATION_SOUND = import.meta.env.VITE_NOTIFICATION_SOUND;
const CHAT_ALIGNMENT = import.meta.env.VITE_CHAT_ALIGNMENT;

const urlParams = new URLSearchParams(window.location.search);
const twitchChannel = urlParams.get('twitch')?.toLowerCase() || CHANNEL;
const youtubeChannel = urlParams.get('youtube') || YOUTUBE_CHANNEL_ID;
const youtubeApiKey = urlParams.get('youtubeKey') || YOUTUBE_API_KEY;
const fade = Number(urlParams.get('fade')) || FADE || 0;
const ignoreParam = urlParams.get('ignore') || IGNORE_USERS || '';
const chatAlignment = urlParams.get('chatAlignment') || CHAT_ALIGNMENT || 'left';

// URL parameters for both platforms
const notificationSound = Boolean(Number(urlParams.get('notificationSound')) || NOTIFICATION_SOUND);
const showPlatform = Boolean(Number(urlParams.get('showPlatform')) || 1);
const ignoredUsers = ignoreParam ? ignoreParam.split(',').map(u => u.trim().toLowerCase()) : [];

const enableTwitch = Boolean(twitchChannel);
const enableYouTube = Boolean(youtubeChannel && youtubeApiKey);

export function App() {
  // Show setup screen if no channels configured
  if (!enableTwitch && !enableYouTube) {
    return (
      <Setup />
    );
  }

  return (
    <Chat
      twitchChannel={twitchChannel}
      youtubeChannel={youtubeChannel}
      youtubeApiKey={youtubeApiKey}
      fade={fade}
      ignoredUsers={ignoredUsers}
      notificationSound={notificationSound}
      chatAlignment={chatAlignment}
      showPlatform={showPlatform}
    />
  );
}
