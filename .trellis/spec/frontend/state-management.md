# State Management

## State Sources

- Local UI state: active view, selected profile, selected target, command palette state.
- Persistent UI preferences: locale and theme.
- Backend state: app paths, profile summaries, target summaries, deploy plans, latest manifest.
- Fixture state: mock usage, drift, guard policy, and menu bar summary until real services exist.

## Rules

- Start with React state and small hooks. Do not add a global state library in Phase 1.
- Use typed API wrappers for Rust data.
- Keep fixture mode visible in UI.
- Do not pretend missing data is official; use confidence labels such as `Missing`, `LocalLog`, or `Estimated`.

## Locale State

- Default `zh-CN`.
- English option `en-US`.
- Fixed UI copy must be keyed and translated.
- User-generated names and paths stay as-is.

## Theme State

- Default `light`.
- `dark` must preserve the same information hierarchy.
- Theme values should map to CSS variables, not component-level hardcoded palettes.
