interface ImportMetaEnv {
  readonly VITE_CHANNEL: string
  readonly VITE_FADE: number
  readonly VITE_IGNORE_USERS: string
  readonly VITE_NOTIFICATION_SOUND: number
  readonly VITE_CHAT_ALIGNMENT: 'left' | 'right'
  readonly VITE_YOUTUBE_API_KEY: string
  readonly VITE_YOUTUBE_CHANNEL_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
