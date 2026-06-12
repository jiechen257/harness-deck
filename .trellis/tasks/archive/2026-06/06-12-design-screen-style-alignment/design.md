# Design

## Scope

This task is a frontend visual alignment of the HarnessDeck workbench and menu bar panel. It keeps the existing data flow and app state while replacing the layout and CSS surface with the product design screen language.

## Source of Truth

- Workbench visual target: `docs/product-design/screens/workbench-home.html`
- Status panel visual target: `docs/product-design/screens/statusbar-panel.html`
- Baseline screenshots:
  - `docs/regression-artifacts/2026-06-12/reference-workbench-home.png`
  - `docs/regression-artifacts/2026-06-12/reference-statusbar-panel.png`

## Component Boundaries

### `src/App.tsx`

Owns the workbench shell:

- Replace the current horizontal titlebar-first shell with a three-column command deck shell.
- Keep locale, theme, active view, shortcuts, pending view routing, and panel-window detection.
- Render the left rail and right inspector with data derived from `appStatus` and static shell copy.
- Keep non-home views available in the center stage canvas.

### `src/components/views/HomeView.tsx`

Owns the home canvas content:

- Keep `getLoopSummary()` as the data source.
- Render prototype-aligned hero health card, today's order, loop phase cards, and flow rows.
- Use derived fixture/live metadata from `LoopSummary`.
- Preserve `onSelectView()` navigation.

### `src/components/menubar/MenuBarPanel.tsx`

Owns the status panel:

- Keep `getLoopSummary()` and `refreshSignals()` behavior.
- Replace old compact card structure with the statusbar HTML hierarchy: stage affordance, capsule head, content cards, action rows, footer.
- Keep standalone behavior for `?panel=1`.

### `src/styles/app.css`

Owns visual language:

- Introduce prototype token aliases (`--bg`, `--fg`, `--border`, `--accent`, `--surface-warm`, spacing/radius aliases) scoped to `.native-status-app` and `.panel-shell`.
- Add or replace workbench and status panel selectors to match the two HTML files.
- Keep existing secondary view selectors usable. Avoid broad resets that break settings/apply/review views.

## Data Mapping

- `healthScore`: `summary.healthScore ?? appStatus.healthScore ?? 0`
- Loop counts:
  - signals -> pending signals
  - practices -> practice cards
  - assets -> local assets
  - review -> local review issues
  - operations -> local ops
- Target cards:
  - App shell uses available target-like fixture status when possible; otherwise static Claude Code/Codex health cards matching the prototype.
- Audit cards:
  - Use `summary.recentAudits` when available; fallback rows remain readable in browser fixture mode.

## Visual Fidelity Strategy

- Copy the reference HTML hierarchy where practical, but use React components and dynamic data.
- Prefer prototype class names for new surfaces to make the CSS mapping direct.
- Use the existing `HarnessLogo` component instead of duplicating inline SVG path data.
- Keep cards and controls within the project's 8px-or-less product guideline where possible, while matching the supplied HTML's larger panel radius for shell surfaces.
- Use Chrome headless screenshots at the same viewport sizes as the reference screenshots:
  - workbench: `1512x900`
  - status panel: `422x768`

## Risks

- Existing `src/styles/app.css` is already modified in the worktree. Edits must be localized and should not revert unrelated changes.
- Pixel-perfect equivalence is limited by React dynamic data, existing logo component rendering, and app shell route differences. The regression note should call out any visible intentional deltas.
- Top-level shell changes can break existing keyboard/navigation tests; keep ARIA labels and visible nav text stable.

## Rollback

Rollback is file-scoped:

- Revert this task's edits to `src/App.tsx`, `src/components/views/HomeView.tsx`, `src/components/menubar/MenuBarPanel.tsx`, and appended/changed CSS blocks in `src/styles/app.css`.
- Remove task-specific screenshots or regression notes only if the implementation is abandoned before acceptance.
