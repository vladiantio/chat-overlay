# Migration Plan: React → Vanilla TS + Web Components

## Overview

Replace all React usage (components, hooks, context, `react-dom` roots, `marked-react`, `lucide-react`, `clsx`) with plain TypeScript, DOM APIs, and native Web Components. React is only used for a small chat overlay (10 messages max, live-updating) plus a setup page — an ideal candidate for a framework-free rewrite. `takumi-js` OG generation is already React-free and is **not** affected.

The migration is **driven by unit tests**: Vitest is introduced up front (Phase 1) and used to characterize current behavior of the pure modules, then to pin the behavior of every new React-free unit as it lands. Screenshots remain the visual-regression check, but the functional contract is enforced by tests.

Follows the pattern established by `tasks/migration-tailwind-to-vanilla/`: phased, per-phase PRs, each leaving the app compiling and visually identical, with a baseline screenshot checkpoint.

## Scope (current React usage)

| React artifact | Location | Vanilla replacement |
| --- | --- | --- |
| React roots | `src/main.tsx`, `src/demo-main.tsx`, `src/demo-setup.tsx` | Plain TS bootstrap in `main.ts` / `demo-main.ts` / `demo-setup.ts` |
| `App.tsx` (config parsing + branching) | `src/App.tsx` | Pure `parseConfig(url, env)` function (unit-tested) + bootstrap code |
| Context (`ChatContext`, `useChat`) | `src/features/chat/chat.tsx` | `ChatController extends EventTarget` store + CustomEvent subscription |
| `ChatRoot` / `ChatContainer` / `ChatMessages` | `src/features/chat/chat.tsx` | `<chat-overlay>` custom element (light DOM) rendering the message list |
| `ChatSection` (orchestrator, message merge) | `src/features/chat/chat-section.tsx` | Part of `<chat-overlay>` (or a plain `ChatManager` class) |
| `MessageRenderer` (`marked-react`) | `src/features/messages/message-renderer.tsx` | `marked` with a custom HTML renderer producing the same classes; pure `renderMarkdown(html: string): string` |
| Platform icons | `src/features/chat/chat-icons.tsx` | Inline SVG strings (delete `lucide-react`) |
| Hooks `useTwitchChat`, `useYouTubeChat` | `src/hooks/*.ts` | `TwitchChatController` / `YouTubeChatController` classes (EventTarget); `createTwitchClient` / `createYouTubeClient` are already React-free |
| `useAutoScroll` | `src/hooks/useAutoScroll.ts` | `container.scrollTop = scrollHeight` after each render |
| `Snippet` (copy button) | `src/components/snippet.tsx` | `<copy-snippet>` custom element |
| `Setup` (form + preview) | `src/components/setup.tsx` | `<chat-setup>` custom element (embeds `<chat-overlay>` for preview) |
| `cn()` over `clsx` | `src/utils/cn.ts` | Tiny hand-written conditional-join helper (no dep) |
| `React.CSSProperties` casts for CSS `if()` syntax + CSS vars | `chat.tsx` | `data-align` attribute + `style.setProperty` in CSS files |

**Deps to remove**: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `marked-react`, `lucide-react`, `clsx`.
**Deps to add**: `marked` (runtime); `vitest`, `happy-dom` (dev, test-only).
**Kept**: `tmi.js`, `takumi-js`, `vite`, `typescript`, `oxlint`, `oxfmt`, `tsx`.

**Untouched**: `src/services/*`, `src/utils/audio.ts`, `src/utils/color.ts`, `src/utils/clipboard.ts`, `src/features/messages/parsers.ts` (pure), `src/features/chat/chat-og.ts`, `src/generate-og.ts`, all `src/styles/*`, `src/features/badges/*`, `src/features/emotes/*`.

## Architecture Decisions

1. **Native Web Components, light DOM.** No shadow root: `global.css` must keep styling `data-slot`-marked internals (OBS `file://` + theming). Custom elements: `<chat-overlay>` (observed attributes `twitch`, `youtube`, `fade`, `alignment`, `show-platform`), `<chat-setup>`, `<copy-snippet>`.
2. **`ChatController` as the single source of truth.** `EventTarget` subclass holding `messages`, with `add/remove/clear` + `CustomEvent("change")`. Both platform controllers push into it; `<chat-overlay>` re-renders `.chat-messages` innerHTML on every change. At MAX_MESSAGES = 10 a full re-render per message is cheaper than diffing — matches current React behavior.
3. **Markdown via `marked` core with a custom renderer.** Reproduce the exact classes `markdown.css` targets: `md-paragraph--image-only`, `md-blockquote`, `md-code`, `md-heading-N`, `md-hr`, `md-image`, `md-link`; `paragraph`/`image` renderers must mirror the current `marked-react` overrides (image-only paragraph detection, link → span, onerror → hide). Escape raw HTML in the `html` renderer (see Risks).
4. **Alignment without inline CSS `if()` hacks.** React currently injects `if(style(--align: right): ...)` strings. Vanilla: `data-align` attribute on the root element; the few conditional rules become CSS selectors (`[data-align="right"] .chat-bubble { ... }`). Per-message dynamic styles (fade animation, `--color` vars) stay inline via `element.style.setProperty`.
5. **Config parsing is a pure, tested function.** The `App.tsx` URL/env parsing (twitch/youtube/fade/ignore/notificationSound/alignment) becomes `parseConfig(url: string, env: Record<string, string | undefined>): OverlayConfig` — unit-tested for precedence rules — and the bootstrap calls it once to build the `<chat-overlay>` attributes.
6. **Entry points.** `index.html` → `/src/main.ts`, `demo.html` → `/src/demo-main.ts`, `demo-setup.html` → `/src/demo-setup.ts`. Demo pages construct `<chat-overlay>` with a seeded store (demodata path replaces `<ChatRoot messages=...>`).
7. **Controllers keep the services' callback API, with injection.** `createTwitchClient`/`createYouTubeClient` already accept `onMessage`/`onDeleted` callbacks — controllers wrap them, keep the 10-message cap, schedule fade removals, play the notification sound. Controllers take the client factory as a constructor parameter (defaulting to the real service) so tests inject fakes instead of mocking `tmi.js`/`fetch`.
8. **Toolchain cleanup only in the final phase.** React stays installed and the app compiles throughout — component conversion is bottom-up (pure renderer first, DOM last), then one PR strips the toolchain.
9. **`erasableSyntaxOnly` stays** — no enums/namespaces/parameter properties in the new code.
10. **`data-slot` attributes preserved** — OBS users style via them; keep every existing `data-slot="..."` value.
11. **Test strategy: Vitest, colocated, no globals.**
    - Tests live next to source: `src/**/*.test.ts` (default Vitest include). Tests import from `vitest` explicitly, so `tsconfig` and `tsc -b` (which includes `src`) need no changes and the test files stay type-checked in the build.
    - Default environment `node`; DOM-dependent tests opt into `happy-dom` via a `// @vitest-environment happy-dom` docblock. `happy-dom` only, no extra globals.
    - Fade-timeout behavior is tested with `vi.useFakeTimers()`.
    - Golden HTML assertions for the markdown renderer; message-shape assertions for the controllers.
    - **Characterize-first**: pure modules that already exist (`parsers.ts`, `color.ts`, `extractChannelId`, `chat-og.ts`) get tests in Phase 1, *before* anything is rewritten, so refactoring risk is pinned to known behavior.
    - Small exportability refactors allowed and required: `messageColors` in `chat-og.ts` is module-private and must be exported for tests; hooks' inline logic becomes the controller classes under test.

## Target structure

```
src/main.ts                       # parseConfig + <chat-overlay> bootstrap (replaces App.tsx + main.tsx)
src/config.ts                     # parseConfig (pure, extracted from App.tsx)   [+ config.test.ts]
src/demo-main.ts                  # seeded demo overlay
src/demo-setup.ts                 # demo setup page
src/components/chat-setup.ts      # <chat-setup> custom element                [+ chat-setup.test.ts]
src/components/copy-snippet.ts    # <copy-snippet> custom element              [+ copy-snippet.test.ts]
src/features/chat/chat-overlay.ts # <chat-overlay> element + list rendering    [+ chat-overlay.test.ts]
src/features/chat/chat-controller.ts      # ChatStore (EventTarget)            [+ chat-controller.test.ts]
src/features/chat/twitch-chat-controller.ts   [+ twitch-chat-controller.test.ts]
src/features/chat/youtube-chat-controller.ts  [+ youtube-chat-controller.test.ts]
src/features/chat/chat-icons.ts   # inline SVG strings (was .tsx)
src/features/messages/message-renderer.ts    # marked → HTML string (was .tsx) [+ message-renderer.test.ts]
src/utils/cn.ts                   # rewrite without clsx                       [+ cn.test.ts]
# deleted: App.tsx, chat-section.tsx, chat.tsx, chat-icons.tsx, snippet.tsx, setup.tsx,
#          message-renderer.tsx, hooks/*.ts, demo-main.tsx, demo-setup.tsx, main.tsx
```

Existing pure modules gain colocated tests in Phase 1: `parsers.test.ts`, `color.test.ts`, `youtube.test.ts` (`extractChannelId`), `chat-og.test.ts` (`messageColors` + `ogChatPreviewNode`).

## Task List (Phase 0–6)

### Phase 0: Baseline
- [ ] Task 1: Baseline snapshot — commit current state; screenshots of overlay (left/right alignment, badges, emotes, reply, fade) and setup page (same workflow as Tailwind migration, `tasks/migration-tailwind-to-vanilla/baseline/`)

### Phase 1: Vitest toolchain + characterize tests (React still installed)
- [ ] Task 2: Add `vitest` + `happy-dom` devDeps and `"test": "vitest run"` / `"test:watch": "vitest"` scripts; add `test` step to `.github/workflows/lint.yml`; export `messageColors` from `chat-og.ts`
- [ ] Task 3: Characterize tests for existing pure modules: `parseMarkdown` (emote boundaries, 7TV, overlap exclusion, reply-prefix strip, `!cmd` codespan, `@mention` bold), `generateColorFromUsername` (determinism, stable per username), `extractChannelId` (UC id, channel URLs, handle passthrough), `chat-og` `messageColors`/`ogChatPreviewNode` (tint/subtle/textOnTint math, alignment flip)
- [ ] Checkpoint: `pnpm test`, `pnpm lint`, `pnpm build` all pass

### Phase 2: Pure renderer (React-free core, still inside React tree)
- [ ] Task 4: Rewrite `message-renderer.tsx` → `message-renderer.ts`: `marked` + custom renderer, same classes, `renderMarkdown()` returns HTML string; thin React wrapper `dangerouslySetInnerHTML` keeps `chat.tsx` working meanwhile
- [ ] Task 5: `message-renderer.test.ts` — golden HTML: headings/blockquote/codespan/hr/image/link classes, image-only paragraph, `!cmd`/`@mention` passthrough from `parseMarkdown`, raw-HTML escaping
- [ ] Checkpoint: `pnpm test` + `pnpm lint` + `pnpm build`; demo page visually matches baseline

### Phase 3: Store + controllers (React-free, not yet used by UI)
- [ ] Task 6: `chat-controller.ts` (EventTarget store) + `twitch-chat-controller.ts` / `youtube-chat-controller.ts` (wrap `createTwitchClient` / `createYouTubeClient` via injected factory, 10-msg cap, fade timeouts, sound)
- [ ] Task 7: Controller tests with injected fakes + fake timers: cap at 10, removal order, fade removal timing (Twitch `fadeSeconds*1000`, YT `+1000` offset), ignored users, deleted-message removal, change-event emission, disconnect cleanup
- [ ] Checkpoint: `pnpm test` + `pnpm lint` + `pnpm build`

### Phase 4: Web components + config
- [ ] Task 8: `config.ts` (`parseConfig` from `App.tsx`) + `config.test.ts` (URL precedence over env, defaults, comma-split ignore list, number parsing)
- [ ] Task 9: `<chat-overlay>` — observed attributes, store subscription, message list rendering, auto-scroll, SVG icons; `cn.ts` rewrite + `cn.test.ts`
- [ ] Task 10: `<copy-snippet>` + `<chat-setup>` (form state, URL builder, preview embed) + happy-dom tests: attribute observation, message rendering with `data-slot`/`data-align`, copy → `navigator.clipboard.writeText` mock + `data-copied` state, setup form → preview element creation
- [ ] Checkpoint: `pnpm test` + `pnpm lint` + `pnpm build`; overlay + setup visually match baseline screenshots (React version still the live one — parity verified via demo pages seeded through the new elements)

### Phase 5: Switch entry points
- [ ] Task 11: `main.ts`, `demo-main.ts`, `demo-setup.ts`; point `index.html` / `demo.html` / `demo-setup.html` at `.ts` files
- [ ] Checkpoint: full manual pass — overlay (left/right, fade, badges, emotes, reply, ignore, sound), setup flow (preview + URL snippet), demo pages

### Phase 6: Remove React toolchain
- [ ] Task 12: Delete remaining `.tsx` files and `src/hooks/`; remove `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `marked-react`, `lucide-react`, `clsx` from `package.json`; drop plugin from `vite.config.ts`; drop `"jsx": "react-jsx"` from `tsconfig.app.json`
- [ ] Checkpoint: `pnpm test` + `pnpm lint` + `pnpm build` + `pnpm preview` (port 4210, strict) pass; `dist/` bundle size delta reviewed (expect big drop)

### Phase 7: Verification + docs
- [ ] Task 13: Final screenshots vs baseline; clean-checkout build: `rm -rf node_modules dist && pnpm install && pnpm build && pnpm test` (needs network for badges/emotes)
- [ ] Task 14: Update `AGENTS.md` (architecture notes, commands incl. `pnpm test`, React mentions → Vanilla TS + Web Components) and confirm CI runs `pnpm test` on PR

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Markdown output drift (`marked-react` → `marked` renderer): different elements/classes than `markdown.css` expects | High | Custom renderer mirrors the exact override set; golden HTML tests (Task 5) pin the contract; demo messages (`demo-main.tsx` m3: headings/blockquote/code/mentions) are the visual golden set |
| Raw HTML in chat messages (e.g. `<img onerror=...>`) now lands in `innerHTML` — same exposure as React today, but this is the moment to fix it | High | Escape raw HTML in the `marked` `html` renderer override (parity of visual output, removes XSS surface); regression test with `<script>`-containing input; document the behavior change |
| Re-render approach: full `innerHTML` rebuild per message — keyed updates, scroll jank, image flicker | Med | MAX_MESSAGES = 10 makes this negligible; keep `scrollTop` fix after render (same as today's `useAutoScroll`); verify in live demo |
| `if(style(--align:...))` inline CSS hack lost in translation → alignment breaks | Med | Replace with `data-align` attribute + CSS selectors in `chat.css` (Task 9); happy-dom test asserts `data-align` output; verify left/right in demo |
| Web component upgrade semantics (`observedAttributes` not reacting, element re-created on attr change) | Med | Attributes set once at bootstrap in `main.ts`; no runtime attr mutation except setup preview (re-create element on channel change); covered by happy-dom attribute tests |
| `marked` sync/async API mismatch (marked v15+ requires explicit handling for sync output) | Low | Use `marked.parse` with the HTML string output in sync mode; pinned dependency version in Phase 2 |
| Fade-removal timing / cap regressions during controller rewrite | Low | Port hook logic verbatim; fake-timer tests assert exact timing and order (Task 7) |
| Tests flaky in happy-dom (timers, clipboard, custom element lifecycle) | Med | Controllers tested in node env with injected fakes (no DOM env needed); happy-dom limited to web-component rendering; clipboard mocked via `navigator.clipboard` stub |
| Visual regression unnoticed | Med | Baseline screenshots (Task 1) + per-phase checks + final diff (Task 13); tests cover functional contract, screenshots cover look |
| New toolchain (`vitest`/`happy-dom`) conflicts with `erasableSyntaxOnly`, `tsc -b`, or oxlint | Low | No test globals (explicit imports); tests colocated under `src` stay in the `tsc -b` build; oxlint parses test files — fix lint violations in tests as they appear |

## Open Questions

- Whether `<chat-overlay>` needs `ignore`/`notification-sound` attributes or stays URL-config-only (current behavior: URL params — keep).
- Whether CI runs `pnpm test` as a separate job or extends the existing lint workflow — extend existing workflow with one extra step (Task 2).

---

## Results (2026-08-05)

All tasks completed. React is fully removed: `src/` contains only TypeScript +
Web Components (`<chat-overlay>`, `<chat-setup>`, `<copy-snippet>`), plain CSS,
and pure modules.

### Verification

- `pnpm test` — 96 tests across 13 files (4 characterize suites, markdown golden
  HTML, controller suites with fake timers, happy-dom element suites)
- `pnpm lint` — 0 warnings, 0 errors
- `pnpm build` — passes (badges + 7TV emotes download, `tsc -b`, `vite build`)
- Clean checkout: `rm -rf node_modules dist && pnpm install && pnpm build && pnpm test` — passes
- `pnpm preview` — port 4210, strict — serves the env-configured overlay
- Visual diff vs baseline (headless Chromium, RMSE, 0 = identical):

  | View | RMSE |
  |---|---|
  | chat-left | 6.20 |
  | chat-right | 7.89 |
  | setup | 1.09 |

  Capture-to-capture noise for the same page is RMSE 1.1–4.4 (network-loaded
  badge/emote images and font fallback rendering). The React build itself
  measures 3.24 vs baseline with the same harness. Residual chat differences:
  network-image subpixel rendering and the documented 3.8 px reply-box quirk
  (see below). Setup page is pixel-close (1.09).

### `dist/` size delta

| Metric | Before (React) | After (vanilla) | Delta |
|---|---|---|---|
| JS raw | 452.40 kB | 233.75 kB | −48% |
| JS gzip | 150.94 kB | 77.36 kB | −49% |

### Issues found & fixed during conversion

- **Raw HTML XSS**: `marked-react` displayed raw HTML as escaped text via React;
  the marked rewrite adds an explicit `html` renderer escape (golden test with
  `<script>` input). No behavior change.
- **Demo data emote offset**: demo message m2 declares `Kappa` at 18–22 instead of
  20–24, so "e Kap" becomes the emote text and the "Kappa" image never shows.
  Reproduced identically in the React build — pre-existing, kept for parity.
- **Reply box clipping (3.8 px)**: Chrome's legacy `-webkit-box` intrinsic sizing
  drops the leading space after the reply `<strong>`, making the line-clamped
  reply box ~3.8 px narrower than its text and clipping the trailing glyph in the
  React version. The vanilla renderer emits the same DOM but the box sizes to the
  full text (trailing "!" visible). Byte-identical DOM/CSS/fonts verified between
  builds; the deviation is a fix, not a regression.
- **`line-clamp` no-op**: `line-clamp: 1` computes to `-webkit-line-clamp: none`
  in Chrome (the shorthand needs `display: -webkit-box` + `-webkit-box-orient:
  vertical`); both old and new versions render single-line replies only because
  the reply text never wraps. Left as-is for parity.
- **Demo capture harness**: CDP `Emulation.setDeviceMetricsOverride` applied
  before navigation is ignored (viewport 780×493); apply it after navigation with
  `--window-size` set at launch.

### Files removed

`App.tsx`, `main.tsx`, `demo-main.tsx`, `demo-setup.tsx`, `chat.tsx`,
`chat-section.tsx`, `chat-icons.tsx`, `message-renderer.tsx`, `snippet.tsx`,
`setup.tsx`, `src/hooks/*`; deps `react`, `react-dom`, `@types/react`,
`@types/react-dom`, `@vitejs/plugin-react`, `marked-react`, `lucide-react`,
`clsx`.
