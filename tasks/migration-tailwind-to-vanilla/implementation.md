# Implementation Plan: Tailwind CSS → Vanilla CSS Migration

## Overview

Replace all Tailwind CSS utilities in the chat overlay with hand-written vanilla CSS, organized into per-concern files under `src/styles/` and imported through the `src/styles/global.css` entry point (which replaces `src/index.css`). Five components (snippet, message-renderer, chat, setup) and the theme variables layer are affected; OG generation is unaffected. Tailwind, `@tailwindcss/vite`, and `tailwind-merge` are removed from the toolchain at the end.

Full reference: `plan.md`.

## Architecture Decisions

- **Styles split by concern** under `src/styles/`, one file per component + shared layers:
  ```
  src/styles/theme.css     # :root theme variables, fonts, keyframes (from @theme)
  src/styles/reset.css     # reset/base styles (Preflight reference)
  src/styles/global.css    # entry point: @imports only (replaces src/index.css)
  src/styles/snippet.css
  src/styles/markdown.css  # message-renderer elements
  src/styles/chat.css      # container, messages, user pill, badges, bubbles
  src/styles/setup.css
  ```
- **Semantic class names** per component (`.snippet-*`, `.chat-*`, `.setup-*`) in the matching `src/styles/*.css` file, rather than utility classes.
- **Theme variables** (`--spacing`, `--color-neutral-*`, `--text-*`, fonts, animations) move from `@theme` to plain `:root` custom properties in `theme.css`, preserving names so existing inline `var(--...)` references in TSX keep working.
- **State toggles** (`-mt-3` ⇄ `-mt-1`, `scale-0 rotate-90` ⇄ `scale-100 rotate-0`) become explicit CSS state classes (`[data-copied="true"]`), not `cn()` overrides.
- **`cn()`** degrades to `clsx` only (tailwind-merge dropped); kept for conditional class strings.
- **Per-component PRs**, each leaving the app compiling and visually identical. Components are independent (Tailwind stays installed until Phase 3), so Tasks 3–6 are parallelizable.
- **Cascade order** is fixed by `global.css` import order: theme → reset → components (snippet, markdown, chat, setup). `global.css` contains only `@import`s. Component files must not rely on inter-file ordering beyond that.
- **Reset/base styles** live in `src/styles/reset.css`, hand-written with `node_modules/tailwindcss/preflight.css` as reference (copy the reset semantics, not verbatim: Preflight's `--theme(--default-font-family, ...)` calls must be replaced with plain `var(...)` and the `--default-*` vars mapped to the `--font-sans`/`--font-mono` tokens in `theme.css`).

## Task List

### Phase 0: Baseline

- [x] Task 1: Baseline snapshot

### Phase 1: Theme variables + entry point

- [x] Task 2: Create `src/styles/` structure (theme + global) and delete `src/index.css`

### Phase 2: Component conversion (one PR each, parallelizable)

- [x] Task 3: Convert `snippet.tsx`
- [x] Task 4: Convert `message-renderer.tsx`
- [x] Task 5: Convert `chat.tsx`
- [x] Task 6: Convert `setup.tsx`

### Checkpoint: Components

- [x] `pnpm lint` passes
- [ ] `pnpm build` passes
- [x] Setup screen + overlay visually match baseline screenshots

### Phase 3: Remove Tailwind

- [x] Task 7: Remove Tailwind deps and plugin; rewrite `cn.ts`

### Checkpoint: Cleanup

- [x] `pnpm lint` + `pnpm build` pass
- [x] `dist/` CSS size delta reviewed

### Phase 4: Verification

- [x] Task 8: Final visual + build verification

## Risks and Mitigations

| Risk                                                                                              | Impact | Mitigation                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `cn()` conflict semantics lost during conversion                                                  | High   | State-based CSS classes (decision #3); keep `clsx` for conditional strings                                        |
| Tailwind v4 theme vars (`--spacing`, `--color-neutral-*`) referenced in TSX inline styles         | High   | Define identical var names in `:root` in Task 2, before any component work                                        |
| CSS split across files: cascade-order mistakes, `@import` ordering issues                         | Med    | Single entry `global.css` with fixed import order (theme → components); verify in dev browser per component       |
| Modern CSS used via Tailwind passthrough (`corner-shape`, `lh` units, `mask-image`) mistranslated | Med    | Copy exact values from utilities; verify in dev browser per component                                             |
| Visual regression unnoticed (no test framework)                                                   | Med    | Screenshots in Task 1; per-task manual visual check; final diff in Task 8                                         |
| Arbitrary-value classes (`h-[calc(100dvh-var(--spacing)*28)]`, `shadow-[...]`) break              | Low    | Convert to explicit `calc()`/box-shadow values, keep `var(--spacing)`                                             |
| Reset copied from Preflight retains Tailwind-specific `--theme()` syntax                          | Low    | Replace `--theme()` with `var()` and map `--default-*` to theme tokens when writing `global.css` (decision above) |

## Open Questions

- None. (If a visual mismatch appears, compare against Phase 0 screenshots before proceeding. Vite bundles `@import`s at build time; keep them relative to `src/styles/global.css`.)
