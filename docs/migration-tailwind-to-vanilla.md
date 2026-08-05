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
