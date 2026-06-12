# Align workbench and statusbar to product design screens

## Goal

Rewrite the current HarnessDeck workbench and menu bar status panel so their visual structure, spacing, color system, cards, navigation, and state summaries match the product design screen HTML files as closely as the current React data model allows.

## What I Already Know

- The visual source of truth for the main workbench is `docs/product-design/screens/workbench-home.html`.
- The visual source of truth for the menu bar panel is `docs/product-design/screens/statusbar-panel.html`.
- Baseline reference screenshots already exist under `docs/regression-artifacts/2026-06-12/`:
  - `reference-workbench-home.png`
  - `reference-statusbar-panel.png`
- Current pre-change application screenshots already exist under the same directory:
  - `current-workbench-home-before.png`
  - `current-statusbar-panel-before.png`
- Current React implementation uses `HomeView` and `MenuBarPanel` with `getLoopSummary()` fixture/Tauri fallback data. The implementation must preserve that data path instead of replacing it with static HTML.
- Current repository has unrelated uncommitted changes. This task must only modify files required for the design alignment and must not revert unrelated work.

## Requirements

- Rework the workbench shell to match the `workbench-home.html` command deck layout:
  - left navigation rail with brand, loop map, tool/workflow actions, and sticky local status footer;
  - center stage with search/actions header and scrollable canvas;
  - right inspector with target health, recent audit, and safety boundary cards;
  - home canvas with hero health card, today order, loop phase cards, and meaningful status rows.
- Rework the menu bar status panel to match `statusbar-panel.html`:
  - centered menu bar stage and bento panel presentation for browser route;
  - capsule header with brand mark, timestamp caption, and health badge;
  - health strip, practice health, local ops, quick actions, and footer matching the reference structure;
  - standalone `?panel=1` route remains usable.
- Keep product semantics and existing app behavior:
  - default zh-CN copy remains available;
  - English locale remains supported for fixed labels where current app supports it;
  - light and dark theme toggles remain functional;
  - navigation to library/apply/review/operations/settings remains functional;
  - fixture mode remains visible when running in browser.
- Use existing dependencies and conventions. Do not add Playwright just for this task; use the available Chrome headless screenshot path.
- Preserve accessibility basics: text labels or `aria-label` on interactive controls, visible focus states, and state text in addition to color.

## Acceptance Criteria

- [ ] `HomeView`, `MenuBarPanel`, and the main workbench shell visually follow the two referenced HTML files at desktop sizes.
- [ ] The browser workbench screenshot at `1512x900` is captured after implementation and compared against `reference-workbench-home.png`.
- [ ] The browser status panel screenshot at `422x768` is captured after implementation and compared against `reference-statusbar-panel.png`.
- [ ] Pixel-diff metrics and visual diff images are recorded under `docs/regression-artifacts/2026-06-12/`.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] A regression note records commands, screenshots, and any known fidelity deltas that remain because the React app renders live fixture data rather than static prototype text.

## Out of Scope

- Changing Rust/Tauri backend behavior.
- Changing persistence, SQLite schema, Keychain behavior, or real Claude/Codex configuration writes.
- Adding new runtime dependencies unless required by existing build tooling.
- Rebuilding every secondary view to match the prototype beyond keeping them usable inside the new shell.

## Technical Notes

- Likely files:
  - `src/App.tsx`
  - `src/components/views/HomeView.tsx`
  - `src/components/menubar/MenuBarPanel.tsx`
  - `src/styles/app.css`
  - optional regression note under `docs/regression/`
- Existing tests are fixture/browser friendly through `src/lib/api.ts` fallbacks.
- `pnpm exec playwright --version` is unavailable in this repo; local Chrome headless successfully generated screenshots.
