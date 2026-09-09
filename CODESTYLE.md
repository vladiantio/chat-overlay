# Code Style

Single source of truth for code conventions. AGENTS.md covers commands and
architecture; this file covers how code should look.

## TypeScript

- `strict`, `noUnusedLocals`, `noUnusedParameters` — no dead code.
- `erasableSyntaxOnly`: no enums, namespaces, or parameter properties.
  Use string-union types (`export type Platform = "twitch" | "youtube"`) and
  `interface` for object shapes (`OverlayConfig`, `*Options`, `ChatMessage`).
- `verbatimModuleSyntax`: type-only imports must use `import type`
  (e.g. `import type { ChatMessage } from "@/types/chat"`).
- Named exports only in `src/` (`export function`, `export class`,
  `export const`). `export default` is allowed only in `vite*.config.ts`.
- Small pure utilities are `const` arrow functions (`cn`, `escapeHtml`,
  `escapeAttr`, `generateColorFromUsername`). Stateful units are classes
  (`ChatController`, `*ChatController`, `*Element`).
- Prefer `readonly` for externally visible state
  (`get messages(): readonly ChatMessage[]`, `static readonly observedAttributes`).

## Imports

Order: `import type` first, then `@/`-aliased imports, then relative imports.
`@/` maps to `./src/`. Side-effect imports for element registration go with the
value imports (see `main.ts`, `chat-overlay.test.ts`).

```ts
import type { ChatMessage } from "@/types/chat";

import { ChatController } from "./chat-controller";
import { TwitchChatController } from "./twitch-chat-controller";
```

## Web Components

- Native `HTMLElement` subclasses, Light DOM only — never `attachShadow`
  (OBS `file://` + external CSS must style internals).
- File, class, and tag names stay in sync: `chat-overlay.ts` →
  `ChatOverlayElement` → `chat-overlay`.
- Declare `static readonly observedAttributes` with kebab-case names; expose
  them via private getters (`fadeSeconds`, `alignment`, `showPlatform`).
- Guard registration: `if (!customElements.get("chat-overlay")) { ... }`.
- Incremental DOM updates: reuse existing nodes keyed by message id
  (`nodesById` / `htmlById` maps), only touch new/removed/changed nodes.
- Internals use class-marked hooks, never ids for styling:
  `chat-*` (overlay), `setup-*` (setup form), `md-*` (rendered markdown).

## Controllers and state

- Shared store is `ChatController extends EventTarget`; subscribers listen for
  `"change"` via `new CustomEvent("change")`. No-op paths (`removeById` miss,
  `clear()` on empty, `removeByIds([])`) return early without dispatching.
- Platform controllers (`TwitchChatController`, `YouTubeChatController`) take
  a single options object (`TwitchChatControllerOptions`), with defaults via
  destructuring (`fadeSeconds = 0`, `ignoredUsers = []`).
- Side effects are injectable for tests: `clientFactory`, `playSound`.
  Lifecycle is explicit `start()` / `disconnect()`; `disconnect()` clears all
  tracked timeouts (`Set<ReturnType<typeof setTimeout>>`) and drops the client.
- Each platform controller caps its own list at `MAX_MESSAGES` (10) before
  pushing timestamp-sorted into the shared store.
- Keep config parsing pure and unit-tested: `parseConfig(url, env)` —
  URL params win over `VITE_*` env, normalizes case/whitespace.

## HTML and escaping

- Never interpolate user content raw. Escape text with `escapeHtml` and
  attribute values with `escapeAttr`; raw markdown HTML is escaped by the
  custom `marked` renderer (`html() { return escapeHtml(text); }`).
- Build message HTML with template literals in one place (`messageHtml`);
  create elements via a wrapper div + `firstElementChild`, not `innerHTML`
  on the live list.

## Tests

- Colocated: `Foo.ts` → `Foo.test.ts` under `src/` (so `tsc -b` type-checks them).
- Explicit imports, no globals: `import { describe, expect, it, vi } from "vitest"`.
- Add `// @vitest-environment happy-dom` as the first line only when the test
  touches the DOM (elements, components). Pure modules and controllers run in node.
- Factory helpers over fixtures: `const message = (id, timestamp): ChatMessage => ({...})`
  or `message(overrides: Partial<ChatMessage>)` with spread overrides.
- Assert event semantics, not just state: change emitted on mutation,
  not emitted on no-op (`removeById("nope")`, empty `clear()`).

## CSS

- Vanilla CSS, one file per area in `src/styles/` (`chat.css`, `setup.css`,
  `markdown.css`, `theme.css`, ...). No frameworks, no CSS-in-JS.
- `body` background stays transparent (OBS overlay); built assets use relative
  paths (`base: "./"`). Tints via CSS vars + `color-mix(in oklab, ...)`.

## Formatting and tooling

- oxfmt is the formatter (2-space indent, double quotes, semicolons, trailing
  commas). Run `pnpm format` before committing; CI checks `oxfmt --check`.
- oxlint for lint (`pnpm lint` / `pnpm lint:fix`). pnpm only — npm/yarn break
  the workspace.
