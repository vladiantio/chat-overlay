# React → Vanilla TS + Web Components — Todo

- [ ] **Task 1** Baseline snapshot (commit + screenshots: overlay left/right, badges, emotes, reply, fade; setup page)
- [ ] **Task 2** Add `vitest` + `happy-dom` devDeps, `test`/`test:watch` scripts, CI test step; export `messageColors` from `chat-og.ts`
- [ ] **Task 3** Characterize tests: `parseMarkdown`, `generateColorFromUsername`, `extractChannelId`, `chat-og` colors/node
- [ ] **Task 4** `message-renderer.ts`: `marked` + custom renderer, `renderMarkdown()` → HTML string, thin React wrapper keeps `chat.tsx` working
- [ ] **Task 5** `message-renderer.test.ts`: golden HTML (classes, image-only paragraph, escaping)
- [ ] **Task 6** `chat-controller.ts` + `twitch-chat-controller.ts` + `youtube-chat-controller.ts` (injected client factories, cap, fade timeouts, sound)
- [ ] **Task 7** Controller tests (fakes + fake timers: cap 10, fade timing, ignore list, deletions, change events, disconnect)
- [ ] **Task 8** `config.ts` (`parseConfig`) + `config.test.ts` (URL > env precedence, defaults, ignore list, numbers)
- [ ] **Task 9** `<chat-overlay>` custom element + auto-scroll + SVG icons; rewrite `cn.ts` + `cn.test.ts`
- [ ] **Task 10** `<copy-snippet>` + `<chat-setup>` + happy-dom tests (attributes, rendering, clipboard mock, form → preview)
- [ ] **Task 11** `main.ts` / `demo-main.ts` / `demo-setup.ts` entry points; update `index.html` / `demo.html` / `demo-setup.html`
- [ ] **Task 12** Delete `.tsx` files + hooks; remove React toolchain deps, vite plugin, `jsx` tsconfig option
- [ ] **Task 13** Final verification: screenshots vs baseline, clean build + `pnpm test`, `pnpm preview`
- [ ] **Task 14** Update `AGENTS.md` (incl. `pnpm test`); confirm CI runs tests
