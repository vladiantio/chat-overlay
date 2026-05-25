# Multi-Stream Chat Overlay

A sleek, transparent chat overlay for OBS that supports both **Twitch** and **YouTube Live** chat simultaneously. Built with React, TypeScript, and Vite.

![Screenshot](https://via.placeholder.com/800x400/2a2a2a/ffffff?text=Multi-Stream+Chat+Overlay)

## Features

- 🔴 **Twitch Chat** - Real-time chat via TMI.js
- ▶️ **YouTube Live Chat** - Real-time chat via YouTube Data API
- 🔄 **Multi-Stream Support** - Connect to both platforms simultaneously
- 🎨 **Beautiful UI** - Modern, glass-morphism design with smooth animations
- 🔊 **Notification Sounds** - Optional audio alerts for new messages
- ⏱️ **Auto-Fade Messages** - Configurable message fade-out
- 🎯 **Platform Indicators** - Visual badges showing message source
- 🎮 **OBS Optimized** - Transparent background, no scrollbars

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repo-url>
cd feedback-chat-twitch

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 2. Configuration

#### Option A: Environment Variables (Recommended for self-hosting)

Copy `.env` to `.env.local` and fill in your configuration:

```env
# Twitch Configuration
VITE_CHANNEL=your_twitch_channel

# YouTube Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key
VITE_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxx
```

#### Option B: URL Parameters (Recommended for OBS Browser Sources)

Configure directly in the OBS Browser Source URL:

```
# Twitch only
http://localhost:5173/?twitch=shroud

# YouTube only
http://localhost:5173/?youtube=UCxxxxxxxxxxxxxxxxxxx&youtubeKey=your_api_key

# Both platforms simultaneously
http://localhost:5173/?twitch=shroud&youtube=UCxxxxxxxxxxxxxxxxxxx&youtubeKey=your_api_key
```

### 3. Getting a YouTube Data API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the API key to your configuration

> ⚠️ **Note:** The YouTube API has quota limits. The default polling interval is 5 seconds, which is well within the free tier limits.

### 4. Finding Your YouTube Channel ID

1. Go to your YouTube channel
2. Look at the URL: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxx`
3. Copy the ID starting with `UC`

Alternatively, if you have a custom URL (`@handle`), you can:

- View page source and search for `"channelId":"UC`
- Or use a [Channel ID finder tool](https://www.streamweasels.com/tools/youtube-channel-id-and-user-id-convertor/)

## URL Parameters

| Parameter           | Description                             | Default       |
| ------------------- | --------------------------------------- | ------------- |
| `twitch`            | Twitch channel name                     | -             |
| `youtube`           | YouTube Channel ID (UC...)              | -             |
| `youtubeKey`        | YouTube Data API Key                    | -             |
| `fade`              | Message fade time in seconds            | `0` (no fade) |
| `ignore`            | Comma-separated list of users to ignore | -             |
| `notificationSound` | Enable sound notifications (`1` or `0`) | `1`           |
| `chatAlignment`     | Text alignment (`left` or `right`)      | `left`        |
| `showPlatform`      | Show platform icons (`1` or `0`)        | `1`           |

### Example URLs

```
# Twitch with 10 second fade
/?twitch=shroud&fade=10

# YouTube with custom alignment
/?youtube=UCxxxxxxxx&youtubeKey=key&chatAlignment=right

# Both platforms with ignored users
/?twitch=shroud&youtube=UCxxx&youtubeKey=key&ignore=bot1,bot2

# Minimal setup (no platform icons)
/?twitch=shroud&showPlatform=0
```

## OBS Setup

1. Add a **Browser Source** to your scene
2. Set the URL to your configured endpoint
3. Set dimensions (recommended: 400x600 or adjust as needed)
4. Enable **Custom CSS** if you want to customize further
5. Check **Shutdown source when not visible** to save resources

### Recommended Browser Source Settings

- **Width**: 400
- **Height**: 600
- **FPS**: 30
- **Custom CSS**: None needed (transparent by default)

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── hooks/
│   ├── useTwitchChat.ts      # Twitch chat connection hook
│   ├── useYouTubeChat.ts     # YouTube chat connection hook
│   └── useAutoScroll.ts      # Auto-scroll functionality
├── services/
│   ├── twitch.ts             # TMI.js client wrapper
│   └── youtube.ts            # YouTube Data API client
├── types/
│   └── chat.ts               # Shared type definitions
├── utils/
│   ├── audio.ts              # Notification sounds
│   ├── badges.ts             # Twitch badge parsing
│   ├── cn.ts                 # Tailwind class merging
│   └── emotes.ts             # Twitch emote parsing
├── App.tsx                   # Main application component
└── index.css                 # Global styles
```

## API Quota Considerations

### YouTube Data API

The YouTube Data API has a quota limit of 10,000 units per day. The overlay uses:

- `liveChatMessages.list`: ~5 units per request
- Default polling: every 5 seconds = 720 requests/hour = 3,600 units/hour

This means you can run approximately **2.7 hours** of continuous polling per day on the free tier. For longer streams:

1. Request a quota increase from Google
2. Increase the polling interval in `src/services/youtube.ts`
3. Only enable YouTube chat when needed

### Twitch

Twitch chat uses WebSocket connections with no API quota limits.

## Customization

### Colors and Styling

The overlay uses Tailwind CSS. Modify `src/index.css` or use custom CSS in OBS:

```css
/* Example: Change message background opacity */
[data-slot="chat-message-text"] > div {
  background-color: rgba(0, 0, 0, 0.8) !important;
}
```

### Fonts

The default font is Figtree (loaded from Google Fonts). Change it in `index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap"
  rel="stylesheet"
/>
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

Requires ES2020 and CSS Custom Properties support.

## Troubleshooting

### YouTube chat not connecting

1. Verify your API key is correct and the YouTube Data API is enabled
2. Check that the channel has an active live stream
3. Check browser console for error messages
4. Verify quota hasn't been exceeded

### Messages not appearing

1. Check that the channel/stream is actually live
2. Verify URL parameters are correct
3. Check if users are in the ignore list
4. Clear browser cache and reload

### High CPU usage

1. Reduce the message limit in `MAX_MESSAGES` constant
2. Disable notification sounds
3. Reduce fade animation duration

## License

MIT License - feel free to use for personal and commercial streaming!

## Credits

- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Twitch integration via [tmi.js](https://github.com/tmijs/tmi.js)
- YouTube integration via [YouTube Data API v3](https://developers.google.com/youtube/v3)
