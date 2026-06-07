# Frontend Quality Guidelines

## Required Tests

Frontend tests should cover:

- default Chinese rendering
- English toggle rendering
- default light theme
- dark theme toggle
- profile list and detail rendering
- target selector state
- deploy plan preview
- dry-run manifest result
- disabled roadmap pages
- Settings preference visibility

## Design Constraints

- First screen is the usable workbench, not a landing page.
- The main window must contain Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings.
- The menu bar panel surface must show current profile, sync status, cost, wake state, and quick actions.
- Beidou visual language appears through subtle star maps, node graph accents, and navigation marks.
- Keep cards at 8px radius or less unless the design system changes.

## Accessibility

- Every interactive control needs a text label or `aria-label`.
- Do not rely on color alone for risk or status.
- Ensure contrast is acceptable in light and dark themes.

## Verification

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

For visual work, start the dev server and verify the rendered app in a browser or Tauri window when possible.
