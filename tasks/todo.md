# Tasks: Tailwind CSS → Vanilla CSS Migration

## Task 1: Baseline snapshot

**Description:** Commit current state and capture visual references before any change.

**Acceptance criteria:**
- [x] Git commit exists marking pre-migration state
- [x] Screenshots of Setup screen + chat overlay (left alignment, right alignment, badges, emotes, fade) saved to `tasks/baseline/`
- [x] `pnpm build` passes on baseline

**Verification:**
- [x] Screenshots viewable and complete
- [x] Build succeeds: `pnpm build`

**Dependencies:** None

**Files likely touched:**
- `tasks/baseline/*.png`

**Estimated scope:** XS

---

## Task 2: Create `src/styles/` structure (theme + reset + global) and delete `src/index.css`

**Description:** Create `src/styles/theme.css` with plain `:root` custom properties, `src/styles/reset.css` with base/reset rules, and `src/styles/global.css` as the `@import`-only entry point, replacing the Tailwind `@theme` block and `@layer` wrappers from `src/index.css`. Preserve exact token names so inline `var(--...)` references in TSX keep resolving: `--font-sans`, `--font-mono`, `--text-base`…`--text-9xl`, `--animate-slide-in` (or the keyframe directly), plus new `--spacing: 0.25rem`, `--color-neutral-800: oklch(0.269 0 0)`, `--color-neutral-900: oklch(0.205 0 0)`. Keep `slideIn`/`fadeOut` keyframes in `theme.css` and all base styles (transparent body, border defaults) in `reset.css`. Use `node_modules/tailwindcss/preflight.css` as the reference for the reset — copy the semantics, but replace its Tailwind-specific `--theme(--default-font-family, ...)` calls with plain `var(...)`, mapping `--default-*` to the `--font-sans`/`--font-mono` tokens. Update the import in `src/main.tsx` from `"./index.css"` to `"./styles/global.css"`, then delete `src/index.css`. Later component files will be appended to the import list in `global.css`.

**Acceptance criteria:**
- [x] `src/styles/theme.css`, `src/styles/reset.css`, `src/styles/global.css` exist; `src/index.css` is deleted
- [x] `src/main.tsx` imports `./styles/global.css`; `global.css` contains only `@import`s: theme → reset → component files, in cascade order
- [x] No `@theme`, `@layer`, or Tailwind directives remain anywhere in `src/styles/`
- [x] `reset.css` has no `--theme()` calls; fonts come from `var(--font-sans)`/`var(--font-mono)`
- [x] All token names used elsewhere in the codebase are defined (`--spacing`, `--color-neutral-800/900`, `--text-*`, fonts)
- [x] `pnpm build` passes with Tailwind still installed

**Verification:**
- [x] Build succeeds: `pnpm build`
- [x] Manual check: dev server shows no console CSS warnings; overlay tokens render

**Dependencies:** Task 1

**Files likely touched:**
- `src/main.tsx` (import path)
- `src/styles/theme.css` (new)
- `src/styles/reset.css` (new)
- `src/styles/global.css` (new, replaces `src/index.css`)

**Estimated scope:** S

---

## Task 3: Convert `snippet.tsx`

**Description:** Replace all Tailwind utilities in `src/components/snippet.tsx` with semantic classes (`.snippet`, `.snippet-text`, `.snippet-button`, `.snippet-icon`) defined in the new `src/styles/snippet.css` (imported via `src/styles/global.css`). Preserve the copy-button icon swap animation as a state-based class pair (`[data-copied="true"]`) instead of `cn()` class toggles. Exact values to preserve: `rounded-xl border bg-neutral-800`, `opacity-50`, `size-8 rounded-lg`, `hover:bg-white/10`, icon `size-4 scale/rotate` transitions.

**Acceptance criteria:**
- [x] No Tailwind utilities remain in `snippet.tsx`
- [x] All snippet styles live in `src/styles/snippet.css`, imported in `global.css` after theme
- [x] Copy animation still swaps Check/Copy icons on click and resets after 2s
- [x] Disabled state (no text) renders dimmed and non-interactive

**Verification:**
- [x] Build succeeds: `pnpm build`
- [x] Manual check: Setup screen shows snippet with working copy button

**Dependencies:** Task 2

**Files likely touched:**
- `src/components/snippet.tsx`
- `src/styles/snippet.css` (new)
- `src/styles/global.css` (add import)

**Estimated scope:** S

---

## Task 4: Convert `message-renderer.tsx`

**Description:** Replace all Tailwind utilities in `src/features/messages/message-renderer.tsx` (paragraph/image sizing, blockquote, codespan, heading size scale, hr, image `lh`-unit sizing, link tint) with semantic classes (`.md-paragraph`, `.md-blockquote`, `.md-code`, `.md-heading-1..6`, `.md-hr`, `.md-image`, `.md-link`) defined in the new `src/styles/markdown.css` (imported via `src/styles/global.css`). Map `text-7xl`…`text-2xl` to `font-size: var(--text-*)`, `h-lh`/`[2lh]` to `lh` units, `line-clamp`/`break-all` equivalents as needed. Use a `data-level` attribute or per-level classes for headings.

**Acceptance criteria:**
- [x] No Tailwind utilities remain in `message-renderer.tsx`
- [x] All markdown styles live in `src/styles/markdown.css`, imported in `global.css`
- [x] Markdown headings render at the correct relative sizes
- [x] Emote/image-only messages keep the `h-[2lh]` sizing behavior

**Verification:**
- [x] Build succeeds: `pnpm build`
- [x] Manual check: send a message with markdown (heading, code, quote, image) in preview

**Dependencies:** Task 2

**Files likely touched:**
- `src/features/messages/message-renderer.tsx`
- `src/styles/markdown.css` (new)
- `src/styles/global.css` (add import)

**Estimated scope:** M

---

## Task 5: Convert `chat.tsx`

**Description:** Replace all Tailwind utilities in `src/features/chat/chat.tsx` (ChatContainer mask, message spacing, user pill with `--tint-color` background, badges, chat bubble with `--subtle-color`, reply block, fade animation inline styles, alignment logic) with semantic classes (`.chat-container`, `.chat-messages`, `.chat-message`, `.chat-user`, `.chat-badges`, `.chat-bubble`, `.chat-reply`) defined in the new `src/styles/chat.css` (imported via `src/styles/global.css`). Preserve: `mask-y-from-[calc(100%-var(--spacing)*4)]` → `mask-image` gradient, `bg-(--tint-color)`/`bg-(--subtle-color)` → `background: var(--tint-color)`, `[corner-shape:squircle]` → `corner-shape: squircle`, `group-last:ring-2 ring-(--tint-color)` → `.chat-message:last-child .chat-bubble { ... }`, conditional `-mt-3`/`-mt-1` → state class. Keep inline `var(--align)` style hooks working.

**Acceptance criteria:**
- [x] No Tailwind utilities remain in `chat.tsx`
- [x] All chat overlay styles live in `src/styles/chat.css`, imported in `global.css`
- [x] Chat container mask, slide-in animation, alignment (left/right), fade-out still work
- [x] Reply block line-clamp and tint-colored last-message ring preserved

**Verification:**
- [x] Build succeeds: `pnpm build`
- [x] Manual check: overlay with badges, reply, both alignments, fade > 0

**Dependencies:** Tasks 2, 4 (imports `MessageRenderer`)

**Files likely touched:**
- `src/features/chat/chat.tsx`
- `src/styles/chat.css` (new)
- `src/styles/global.css` (add import)

**Estimated scope:** M

---

## Task 6: Convert `setup.tsx`

**Description:** Replace all Tailwind utilities in `src/components/setup.tsx` (responsive two-column grid, card, form, input, button, chat preview sizing) with semantic classes (`.setup`, `.setup-card`, `.setup-form`, `.setup-input`, `.setup-button`, `.setup-preview`) defined in the new `src/styles/setup.css` (imported via `src/styles/global.css`). Preserve: `md:grid-cols-2` → `@media (min-width: 768px)` media query, `h-[calc(100dvh-var(--spacing)*28)]` → `height: calc(100dvh - var(--spacing) * 28)` (or tokenized), input focus ring, button hover lift/shadow and disabled states.

**Acceptance criteria:**
- [x] No Tailwind utilities remain in `setup.tsx`
- [x] All setup styles live in `src/styles/setup.css`, imported in `global.css`
- [x] Grid collapses to one column below 768px, two columns above
- [x] Input focus ring, button hover/shadow/disabled behaviors preserved

**Verification:**
- [x] Build succeeds: `pnpm build`
- [x] Manual check: Setup screen at desktop + narrow widths

**Dependencies:** Tasks 2, 3, 5 (renders `Snippet`, `ChatSection`)

**Files likely touched:**
- `src/components/setup.tsx`
- `src/styles/setup.css` (new)
- `src/styles/global.css` (add import)

**Estimated scope:** M

---

### Checkpoint: Components (after Tasks 3–6)
- [x] `pnpm lint` passes
- [x] `pnpm build` passes
- [x] Visual comparison vs `tasks/baseline/` screenshots shows no regressions
- [x] Human review before Phase 3

---

## Task 7: Remove Tailwind deps and plugin; rewrite `cn.ts`

**Description:** Remove `tailwindcss` and `@tailwindcss/vite` from `package.json`, remove the `tailwindcss()` plugin from `vite.config.ts`, remove `tailwind-merge` from dependencies, and rewrite `src/utils/cn.ts` to use `clsx` only (drop `twMerge`). Run `pnpm install` and delete any leftover Tailwind-only variables from `src/styles/theme.css` not referenced by TSX.

**Acceptance criteria:**
- [x] No `tailwindcss`/`tailwind-merge` in `package.json` or lockfile
- [x] `vite.config.ts` has no Tailwind plugin
- [x] `cn.ts` imports only `clsx`; behavior of conditional class strings unchanged
- [x] No `tailwind` references anywhere in `src/`, `src/styles/`, `vite.config.ts`, `index.html`

**Verification:**
- [x] Install: `pnpm install` succeeds
- [x] Build succeeds: `pnpm build`
- [x] Lint succeeds: `pnpm lint`

**Dependencies:** Tasks 3–6

**Files likely touched:**
- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`
- `src/utils/cn.ts`
- `src/styles/theme.css`
- `src/styles/global.css`

**Estimated scope:** S

---

## Task 8: Final verification

**Description:** Full end-to-end verification of the migrated app: lint, build, visual diff against baseline screenshots (both alignments, fade, replies, badges, emotes, markdown), and review of `dist/` CSS size delta.

**Acceptance criteria:**
- [x] `pnpm lint` passes
- [x] `pnpm build` passes
- [x] Overlay + Setup screen visually identical to baseline screenshots
- [x] `dist/` CSS output size documented in the migration doc

**Verification:**
- [x] All acceptance criteria met
- [x] Ready for merge

**Dependencies:** Task 7

**Files likely touched:**
- `docs/migration-tailwind-to-vanilla.md` (size delta note, if desired)

**Estimated scope:** S

---

## Definition of Done (all tasks)

- [x] Every task above completed and checked
- [x] `pnpm lint` + `pnpm build` green on final state
- [x] No visual regressions vs baseline
- [x] Migration doc updated with results
