# Chat Overlay

Purely client-side SPA (React 19, Vite 8, Tailwind v4). Zero server.

## Commands

| Command         | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| `pnpm dev`      | Dev server (HMR)                                      |
| `pnpm build`    | `download-badges → generate:og → tsc -b → vite build` |
| `pnpm lint`     | oxlint                                                |
| `pnpm lint:fix` | oxlint --fix                                          |
| `pnpm format`   | oxfmt                                                 |
| `pnpm preview`  | Serve `dist/` on port **4210** (strict)               |

No test framework exists, no test command.

## Toolchain quirks

- **pnpm only.** `pnpm-workspace.yaml` present; npm/yarn will break.
- **oxlint + oxfmt** (not ESLint, not Prettier). `.vscode/settings.json` sets oxfmt as default formatter.
- **`erasableSyntaxOnly`** in tsconfig — no enums, namespaces, parameter properties.
- **`@/` alias** → `./src/` (e.g. `@/types/chat`).
- **`base: "./"`** — built app uses relative paths (for OBS `file://` sources). Transparent `body` background.

## Build requires network

`pnpm build` (and `pnpm postinstall`) run:

1. `download-badges` — fetches Twitch badges from `api.streamdatabase.com` → `src/features/badges/badges.json` (gitignored)
2. `generate:og` — fetches Twemoji SVGs from CDN → `public/og.jpg` (gitignored)

Both skip if output already exists unless `--force`.

## Configuration

URL query params override env vars at runtime:

- `?twitch=CHANNEL&youtube=CHANNEL_ID&fade=120&ignore=user1,user2`
- Falls back to `VITE_CHANNEL`, `VITE_YOUTUBE_CHANNEL_ID`, etc. in `.env*`

When no channels configured, the `Setup` component renders.

## CI

`.github/workflows/lint.yml` — `pnpm lint:github` only, on PR and push to `main`.

## YouTube polling

Default 5s interval. Free API tier: ~10k units/day, ~2.7h runtime. Badge code is commented out (YouTube messages never show badges).

## Architecture notes

- `useTwitchChat` (TMI.js WebSocket) + `useYouTubeChat` (REST polling) — each caps at **10 messages**.
- Message fade via CSS animation driven by `fadeSeconds` param.
- Badges are static (not fetched at runtime).
- OG image generated at build time (satori + sharp).
