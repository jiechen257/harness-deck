# State Management

## State Sources

All state lives in React `useState` hooks inside `App.tsx`. No global state library.

| State | Type | Persistence |
|-------|------|-------------|
| `activeView` | `ViewId` | In-memory only |
| `locale` | `Locale` | `localStorage` |
| `theme` | `Theme` | `localStorage` |
| `profiles` | `ProfileSummary[]` | Fetched from `api.ts` on view mount |
| `targets` | `TargetSummary[]` | Fetched from `api.ts` on view mount |
| `deployPlan` | `DeployPlan \| null` | Generated on demand |
| `manifest` | `ManifestSummary \| null` | Written after dry-run confirmation |

## Locale State

- Default `zh-CN`, toggles to `en-US`.
- All fixed UI copy is in the `copy` object inside `App.tsx`, keyed by locale:

```tsx
const copy = {
  "zh-CN": {
    title: "HarnessDeck 命令中心",
    currentProfile: "当前配置集",
    // ...
  },
  "en-US": {
    title: "HarnessDeck Command Center",
    currentProfile: "Current Profile",
    // ...
  },
} satisfies Record<Locale, Record<string, string>>;
```

- Product-generated names (profile names, target names, file paths, manifest IDs) are never translated.

## Theme State

- Default `light`, toggles to `dark`.
- Applied via `data-theme` attribute on the app shell element:

```tsx
<div data-theme={theme} data-testid="app-shell">
```

- CSS variables are scoped under `[data-theme="dark"]` in `styles/app.css`.

## Confidence Labels

Usage metrics carry a `DataConfidence` field (`Official`, `LocalLog`, `Estimated`, `Missing`) that must be rendered as a visible badge. Do not display unconnected data sources as if they were authoritative.

## Rules

- No global state library. Plain React state + `useEffect` data fetching is sufficient.
- Keep fixture mode visible in UI at all times.
- Use typed API wrappers from `lib/api.ts` for all backend data.
