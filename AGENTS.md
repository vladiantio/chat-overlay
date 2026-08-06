# Chat Overlay

Purely client-side SPA (TypeScript, Vite 8, vanilla CSS, native Web Components). Zero server, zero framework.

## Commands

| Command                    | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                 | Dev server (HMR)                                              |
| `pnpm download-7tv-emotes` | Download 7TV global emotes                                    |
| `pnpm download-badges`     | Download Twitch global badges                                 |
| `pnpm build`               | `download-badges → download-7tv-emotes → tsc -b → vite build` |
| `pnpm generate:og`         | Generate OG image                                             |
| `pnpm generate:og:watch`   | Generate OG image (watch mode)                                |
| `pnpm lint`                | oxlint                                                        |
| `pnpm lint:fix`            | oxlint --fix                                                  |
| `pnpm format`              | oxfmt                                                         |
| `pnpm preview`             | Serve `dist/` on port **4210** (strict)                       |
| `pnpm test`                | Vitest run (colocated `src/**/*.test.ts`)                     |
| `pnpm test:watch`          | Vitest watch                                                  |

No test framework config file: Vitest defaults + per-file `// @vitest-environment happy-dom` docblocks where a DOM is needed (controllers and pure modules run in node).

## Toolchain quirks

- **pnpm only.** `pnpm-workspace.yaml` present; npm/yarn will break.
- **oxlint + oxfmt** (not ESLint, not Prettier). `.vscode/settings.json` sets oxfmt as default formatter.
- **`erasableSyntaxOnly`** in tsconfig — no enums, namespaces, parameter properties.
- **`@/` alias** → `./src/` (e.g. `@/types/chat`).
- **`base: "./"`** — built app uses relative paths (for OBS `file://` sources). Transparent `body` background.
- **No test globals**: tests import `describe/it/expect` from `vitest` explicitly; test files live under `src/` so `tsc -b` keeps type-checking them.

## Build & OG generation requires network

- `pnpm build` (and `pnpm postinstall`) run:
  1. `download-badges` — fetches Twitch global badges from `api.streamdatabase.com` → `src/features/badges/badges.json` (gitignored)
  2. `download-7tv-emotes` — fetches 7TV global emotes from `api.7tv.app` → `src/features/emotes/stv-emotes.json` (gitignored)

  Both skip if output already exists unless `--force`.

- `generate:og` renders with `takumi-js` (native Rust, no headless browser) → `public/og.jpg` (gitignored). Emoji are handled by Takumi's built-in twemoji provider.

## Configuration

URL query params override env vars at runtime:

- `?twitch=CHANNEL&youtube=CHANNEL_ID&fade=120&ignore=user1,user2`
- Falls back to `VITE_CHANNEL`, `VITE_YOUTUBE_CHANNEL_ID`, etc. in `.env*`
- `src/config.ts` `parseConfig(url, env)` is a pure, unit-tested function; `src/main.ts` runs it once and sets `<chat-overlay>` attributes from the result

When no channels configured, `<chat-setup>` renders.

## Web Components

Light DOM, no shadow roots (OBS `file://` + external CSS must style class-marked internals):

- `<chat-overlay>` — observed attributes `twitch`, `youtube`, `youtube-key`, `fade`, `alignment`, `show-platform`, `ignore`, `notification-sound`; owns a `ChatController` store; incrementally updates the message list on every `change` event (existing message elements are reused, only new/removed/changed ones are touched); `seedMessages()` supports demo mode
- `<chat-setup>` — channel form → overlay URL snippet + live preview
- `<copy-snippet>` — copy button with `data-copied` state

## CI

`.github/workflows/lint.yml` — `pnpm lint:github` and `pnpm test` jobs, on PR and push to `main`.

## YouTube polling

Default 5s interval. Free API tier: ~10k units/day, ~2.7h runtime. Badge code is commented out (YouTube messages never show badges).

## Architecture notes

- `TwitchChatController` (tmi.js WebSocket, `src/services/twitch.ts`) + `YouTubeChatController` (REST polling) — each keeps its own 10-message cap, then pushes timestamp-sorted into the shared `ChatController` (EventTarget; `change` CustomEvent drives `<chat-overlay>` re-render).
- Message fade via CSS animation driven by `fadeSeconds` param; controllers schedule removals (YouTube offset +1s).
- Badges are static (not fetched at runtime).
- Markdown: `marked` with a custom HTML renderer (`src/features/messages/message-renderer.ts`) — golden-HTML tested; raw HTML input is escaped.
- OG image generated at build time (takumi-js).
