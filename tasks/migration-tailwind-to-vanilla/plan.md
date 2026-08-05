# Migration Plan: Tailwind CSS → Vanilla CSS

## Scope (current Tailwind usage)

- **5 files** with utilities: `src/components/setup.tsx`, `src/components/snippet.tsx`, `src/features/chat/chat.tsx`, `src/features/messages/message-renderer.tsx`, plus `src/index.css` (`@import "tailwindcss"` + `@theme`) and `src/utils/cn.ts`
- **~112 unique utility tokens** across 36 `className` attributes
- **Deps to remove**: `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`; keep `clsx`
- OG generation (`src/features/chat/chat-og.ts`, `src/generate-og.ts`) uses inline styles — **unaffected**

## Target structure

```
src/styles/theme.css      # theme variables, fonts, keyframes (from @theme)
src/styles/reset.css      # reset/base styles (Preflight reference)
src/styles/global.css     # entry point: @imports only (replaces src/index.css)
src/styles/snippet.css
src/styles/markdown.css   # message-renderer elements
src/styles/chat.css       # container, messages, user pill, badges, bubbles
src/styles/setup.css
```

`src/index.css` is deleted; `src/main.tsx` imports `./styles/global.css` instead.

## Phase 0 — Baseline (safe revert point)

- Commit current state; take screenshots of Setup screen + chat overlay (left/right alignment, badges, emotes, fade)

## Phase 1 — Theme variables + entry point

- Convert `@theme` in `src/index.css` → plain CSS custom properties on `:root` in `src/styles/theme.css`
- Define Tailwind vars your code relies on:
  - `--spacing: 0.25rem` (used in `setup.tsx:85`, `chat.tsx:56`)
  - `--color-neutral-900` (`chat.tsx:90`), `--color-neutral-800` (`snippet.tsx` bg)
  - Keep the `--text-*` scale as-is; keep `slideIn`/`fadeOut` keyframes
- Keep `@keyframes` in `theme.css`; move base styles (transparent body, border defaults) to `src/styles/reset.css`; drop `@layer` wrappers
- Use `node_modules/tailwindcss/preflight.css` as the reference for the reset — copy the semantics, but replace its Tailwind-specific `--theme(--default-font-family, ...)` calls with plain `var(...)`, mapping `--default-*` to the `--font-sans`/`--font-mono` tokens in `theme.css`
- `src/styles/global.css` is the `@import`-only entry point: `theme.css` → `reset.css` → component files, in cascade order
- Update `src/main.tsx` import to `./styles/global.css`; delete `src/index.css`

## Phase 2 — Component-by-component conversion (1 PR per file)

Per component: replace utilities with semantic classes in the matching `src/styles/*.css` file (e.g. `.setup-card`, `.chat-bubble`, `.chat-message-user`), importing it from `global.css`.

Special mappings to handle:

| Tailwind | Vanilla CSS |
|---|---|
| `bg-(--tint-color)` / `bg-(--subtle-color)` | `background: var(--tint-color)` |
| `[corner-shape:squircle]` | `corner-shape: squircle` (raw passthrough) |
| `mask-y-from-[calc(100%-var(--spacing)*4)]` | `mask-image: linear-gradient(...)` |
| `md:grid-cols-2` | `@media (min-width: 768px)` |
| `hover:`/`active:`/`disabled:`/`focus:` variants | plain pseudo-selectors |
| `h-lh`, `[2lh]`, `line-clamp-1`, `wrap-anywhere`, `text-pretty` | `lh` units, `-webkit-line-clamp`, `overflow-wrap: anywhere` |
| `animate-slide-in` | `animation: slideIn ...` |
| `text-7xl`…`text-2xl` (markdown headings) | `font-size: var(--text-7xl)` etc. |

**Critical**: preserve `cn()` conflict semantics (conditional toggles like `scale-0 rotate-90` ⇄ `scale-100 rotate-0`, `-mt-3` ⇄ `-mt-1`, `opacity-50`, `group-last:ring-2`). Either use CSS classes that encode state (`[data-copied="true"]`) or keep `clsx` for conditional strings.

## Phase 3 — Remove Tailwind

- Remove `tailwindcss()`, `@tailwindcss/vite`, `tailwind-merge` from `vite.config.ts` / `package.json`
- Rewrite `src/utils/cn.ts` to `clsx` only (or drop entirely)
- Delete leftover theme vars in `src/styles/theme.css`

## Phase 4 — Verify

- `pnpm lint` + `pnpm build` (build pulls badges/emotes — requires network)
- Visual diff vs Phase 0 screenshots (both alignments, fade, replies, badges, markdown images)
- Check `dist/` CSS size delta

**Suggested order**: `snippet` → `message-renderer` → `chat` → `setup` (leaf → root, each step compiles).

---

## Results (2026-08-05)

All phases completed. Baseline screenshots in `tasks/baseline/` were regenerated during
Phase 2 — the original demo build lacked the Tailwind Vite plugin and captured unstyled
pages; the true baseline now reflects the real pre-migration rendering.

### Verification

- `pnpm lint` — 0 errors, 0 warnings
- `pnpm build` — passes (badges + 7TV emotes download, `tsc -b`, `vite build`)
- Visual diff vs baseline (headless Chromium, RMSE metric, 0 = identical):

  | View | RMSE |
  |---|---|
  | chat-left (badges, emotes, markdown, reply) | 0.0029 |
  | chat-right | 0.0029 |
  | chat-fade (mid-animation frame, phase-sensitive) | 0.0002 |
  | setup | 0.0029 |

  Residual differences are single-pixel antialiasing noise (subpixel glyph/shadow
  edges), not layout or color changes.

### `dist/` CSS size delta

| Metric | Before (Tailwind) | After (vanilla) | Delta |
|---|---|---|---|
| CSS raw | 24.27 kB | 11.58 kB | −52% |
| CSS gzip | 5.32 kB | 3.29 kB | −38% |
| JS raw | 481.83 kB | 452.40 kB | −6% (tailwind-merge dropped) |

### Issues found & fixed during conversion

- **Shorthand `border` resets border-color**: `border: 1px solid` resets the color to
  `currentColor` (bright white), while Tailwind's `border` utility only sets width+style
  and lets the universal `border-color: oklch(1 0 0 / 0.1)` rule apply. Fixed by using
  `border-width` + `border-style` in `chat.css`/`setup.css`/`markdown.css`.
- **`--text-N--line-height` tokens missing**: Tailwind v4 keeps default per-size
  line-height ratios (`calc(1.25 / 0.875)` for `text-sm`, etc.) even when the app
  overrides only the font size. Missing ratios caused 1–2 px vertical layout shifts.
  Ratios added to `theme.css` and referenced from `setup.css`, `snippet.css`,
  `markdown.css`.
- **`md:` card alignment split**: the two setup cards use different `align-items`
  (`flex-start` vs `center`); one shared class wrongly unified them. Split via a
  `.setup-card--center` modifier.
- **Demo baseline capture**: screenshots of the demo harness must build with the Tailwind
  plugin for a valid pre-migration reference (the committed `vite.demo.config.ts` is
  plugin-free — fine after Task 7).
