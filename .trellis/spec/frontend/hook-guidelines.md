# Hook Guidelines

## Custom Hooks

Use hooks for reusable UI state and browser/Tauri side effects:

- `usePersistentPreference` for locale and theme preferences.
- Future hooks may wrap polling latest manifest or app status refresh.

## Side Effects

- Keep localStorage access in a hook or state helper.
- Keep Tauri IPC calls in `lib/api.ts`; a hook can call API helpers but should not construct raw command names.
- Do not read real user config files from frontend code.

## Persistence

- Locale defaults to `zh-CN`.
- Theme defaults to `light`.
- Preferences should survive reloads.

## Testing

Hook behavior should be covered by frontend tests when it affects user-visible state, especially locale/theme persistence.
