# React → Vanilla TS + Web Components — Todo

- [x] **Task 1** Baseline snapshot (commit + screenshots: overlay left/right, badges, emotes, reply, fade; setup page) — `tasks/migration-react-to-vanilla/baseline/`
- [x] **Task 2** Add `vitest` + `happy-dom` devDeps, `test`/`test:watch` scripts, CI test step; export `messageColors` from `chat-og.ts`
- [x] **Task 3** Characterize tests: `parseMarkdown`, `generateColorFromUsername`, `extractChannelId`, `chat-og` colors/node — 22 tests pinning current behavior (notably: 7TV global emotes like "hello"/"HUH" get substituted; `messageColors("#000000")` yields `#111111` text)
- [x] **Task 4** `message-renderer.ts`: `marked` + custom renderer, `renderMarkdown()` → HTML string, thin React wrapper keeps `chat.tsx` working
- [x] **Task 5** `message-renderer.test.ts`: golden HTML (classes, image-only paragraph, raw-HTML escaping — removed XSS surface)
- [x] **Task 6** `chat-controller.ts` + `twitch-chat-controller.ts` + `youtube-chat-controller.ts` (injected client factories, cap, fade timeouts, sound)
- [x] **Task 7** Controller tests (fakes + fake timers: cap 10, fade timing incl. YT +1s offset, ignore list, deletions, change events, disconnect)
- [x] **Task 8** `config.ts` (`parseConfig`) + `config.test.ts` (URL > env precedence, defaults, ignore list, numbers)
- [x] **Task 9** `<chat-overlay>` custom element + auto-scroll + SVG icons; rewrite `cn.ts` + `cn.test.ts`; alignment moved to `data-align` + CSS selectors
- [x] **Task 10** `<copy-snippet>` + `<chat-setup>` + happy-dom tests (attributes, rendering, clipboard mock, form → preview)
- [x] **Task 11** `main.ts` / `demo-main.ts` / `demo-setup.ts` entry points; `index.html` / `demo.html` / `demo-setup.html` updated
- [x] **Task 12** Delete `.tsx` files + hooks; remove React toolchain deps, vite plugin, `jsx` tsconfig option — dist JS 452 kB → 234 kB
- [x] **Task 13** Final verification: screenshots vs baseline (see plan Results), clean build (`rm -rf node_modules dist && pnpm install && pnpm build && pnpm test`), `pnpm preview` on 4210
- [x] **Task 14** Update `AGENTS.md` (incl. `pnpm test`); CI runs `pnpm test` on PR

## Notes

- Demo screenshot capture uses headless Chromium over CDP: fresh browser per run,
  `--window-size=800,600` + `Emulation.setDeviceMetricsOverride` *after* navigation
  (applying it before navigation produces a 780×493 viewport and broken captures).
  Script: `/tmp/opencode/capture7.mjs` (not committed).
- Known 3.8 px deviation on reply bubbles: Chrome's old `-webkit-box` intrinsic
  sizing drops the leading space of the text run after the reply `<strong>` when
  the bubble is `width: fit-content`, shrinking the box below its content. The
  React version inherited this (its reply text's trailing "!" is clipped); the
  vanilla version renders the reply fully. Root cause verified by byte-identical
  DOM/CSS/fonts between builds with differing box widths; deliberately not
  reproduced.
