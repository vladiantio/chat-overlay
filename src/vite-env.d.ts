interface ImportMetaEnv {
  readonly VITE_CHANNEL: string
  readonly VITE_FADE: number
  readonly VITE_IGNORE_USERS: string
  readonly VITE_NOTIFICATION_SOUND: number
  readonly VITE_CHAT_ALIGNMENT: 'left' | 'right'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
