# Frontend Quality Guidelines

## Test Structure

All frontend tests are in `src/App.test.tsx`, using `@testing-library/react` + `vitest` + `jsdom`. Tests run against fixture data (no Tauri runtime).

### Test coverage areas

| Area | What to verify |
|------|---------------|
| Locale | Default zh-CN rendering; English toggle changes copy |
| Theme | Default light `data-theme`; dark toggle changes attribute |
| Navigation | Sidebar nav buttons, `aria-current="page"`, keyboard shortcuts (Cmd+1-9, Cmd+,, Escape) |
| Profiles | Fixture profile list renders, target selectors work |
| Sync | Deploy plan preview, dry-run confirmation, manifest result |
| Sync governance | Three-way diff, conflict queue, drift detection, rollback preview |
| Target discovery | Blocked without authorization, visible after explicit grant |
| Usage | Metrics with confidence badges (LocalLog, Estimated, Missing) |
| Account | Keychain references visible, secret values hidden |
| Guard | Privacy, backup, real-write protection policies |
| Registry | Templates list, find-best-skill scoring, no remote call |
| Insights | Local rule insights, high-priority feed items |
| Wake | Wake modes, experimental lid-awake requires confirmation |
| Menubar panel | `?panel=1` renders standalone panel with profile/sync/cost/wake |

### Example: Test pattern

```tsx
// src/App.test.tsx
it("switches from the default light theme to dark", async () => {
  const user = userEvent.setup();
  render(<App />);

  const shell = screen.getByTestId("app-shell");
  expect(shell).toHaveAttribute("data-theme", "light");

  await user.click(screen.getByRole("button", { name: "深色" }));
  expect(shell).toHaveAttribute("data-theme", "dark");
});
```

## Design Constraints

- First screen is the usable workbench with a status console, not a landing page.
- Main window has 9 views accessible via 5 nav groups with secondary sub-tabs.
- Menubar panel shows current profile, sync status, cost, wake state, quick actions.
- Keep cards at 8px radius or less.
- Native feel: system font, default cursor on non-interactive elements, suppressed WebKit context menu.

## Accessibility

- Every interactive control needs a text label or `aria-label`.
- Do not rely on color alone for risk or status — pair with text badges.
- Ensure contrast in both light and dark themes.
- Navigation uses `role="navigation"` with `aria-label="Workbench views"`.

## Verification

```bash
pnpm lint       # eslint, zero warnings
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run (jsdom)
```

For visual work, run `pnpm dev` and verify in browser, or `pnpm tauri:dev` for the full desktop app.
