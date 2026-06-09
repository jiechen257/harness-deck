# Hook Guidelines

## Current Hooks

The app uses standard React hooks inline in `App.tsx`. There are no custom hook files. Persistent preferences are managed directly with `useState` + `localStorage`:

```tsx
// src/App.tsx — locale persistence pattern
const [locale, setLocale] = useState<Locale>(() => {
  const stored = localStorage.getItem("harnessdeck-locale");
  return stored === "en-US" ? "en-US" : "zh-CN";
});

useEffect(() => {
  localStorage.setItem("harnessdeck-locale", locale);
}, [locale]);
```

The same pattern is used for theme (`harnessdeck-theme`), defaulting to `"light"`.

## Side Effect Rules

- Keep `localStorage` access inside `App.tsx` state initialization and `useEffect` syncs.
- Keep Tauri IPC calls in `lib/api.ts`. Components call typed API functions, never raw `invoke()`.
- Do not read real user config files from frontend code.

## Data Fetching

Views fetch data from `lib/api.ts` in `useEffect` on mount:

```tsx
// typical data loading in a view component
const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
useEffect(() => {
  listProfiles().then(setProfiles);
}, []);
```

## Defaults

| Preference | Default | Storage key |
|-----------|---------|-------------|
| Locale | `zh-CN` | `harnessdeck-locale` |
| Theme | `light` | `harnessdeck-theme` |

Both survive page reloads via `localStorage`.

## Testing

Hook behavior is covered through component tests in `App.test.tsx` — there are no isolated hook tests. Theme and locale switching are verified by rendering `App` and clicking toggle buttons.
