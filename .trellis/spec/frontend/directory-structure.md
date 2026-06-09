# Directory Structure

Frontend code lives under `src/` with a deliberately flat layout.

## Directory Layout

```text
src/
  main.tsx              # React root render
  App.tsx               # All views as inline components; workbench + menubar panel
  App.test.tsx          # All frontend tests in one file
  lib/
    api.ts              # Tauri invoke wrappers with browser fixture fallbacks
    types.ts            # TypeScript types mirroring Rust domain structs
  styles/
    app.css             # Single CSS file; [data-theme="dark"] for theming
  test/
    setup.ts            # Vitest/jsdom test setup
```

## Why Flat

The project keeps all views and components inside `App.tsx` as inline function components. There is no `components/` directory, no `app/copy.ts`, and no router. This is intentional — the codebase is small enough that colocated inline components reduce indirection.

## Key Files

| File | Responsibility |
|------|---------------|
| `App.tsx` | All 9 workbench views, `MenuBarPanel`, navigation, locale/theme state, `copy` object with zh-CN/en-US translations |
| `lib/api.ts` | Only file that calls `invoke()`. Each function has a Tauri path and a browser fixture fallback. |
| `lib/types.ts` | All shared interfaces and union types (`Locale`, `Theme`, `TargetKind`, `RiskLevel`, etc.) |
| `styles/app.css` | CSS custom properties, `[data-theme="dark"]` selector, layout styles |

## Routing

No router library. View switching uses in-memory React state (`activeView: ViewId`). The menubar panel is distinguished by `?panel=1` URL parameter:

```tsx
// src/App.tsx
const isPanel = new URLSearchParams(window.location.search).get("panel") === "1";
if (isPanel) return <MenuBarPanel />;
```

## Assets

Prefer CSS/tokenized visuals. Icons come from `lucide-react`. No large decorative images.
