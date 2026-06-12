# Implementation Plan

## Phase 1: Prepare

- [x] Read frontend specs and current component/test expectations.
- [x] Confirm reference and current screenshots exist.
- [x] Start task with `task.py start` after planning artifacts are complete.

## Phase 2: Implement

- [x] Update `App.tsx` shell to prototype-aligned workbench layout.
- [x] Update `HomeView.tsx` to prototype-aligned home canvas while preserving `getLoopSummary()`.
- [x] Update `MenuBarPanel.tsx` to prototype-aligned statusbar panel while preserving refresh/open behavior.
- [x] Update `src/styles/app.css` with command deck and status panel styles.
- [x] Fix TypeScript, lint, and test regressions from shell/markup changes.

## Phase 3: Visual Verification

- [x] Run `pnpm dev` on an available local port.
- [x] Capture implemented workbench screenshot at `1512x900`.
- [x] Capture implemented status panel screenshot at `422x768`.
- [x] Generate pixel diff metrics and diff images against the reference screenshots.
- [x] Visually inspect reference/current/after/diff images.

## Phase 4: Regression Verification

- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Record commands, screenshots, and known deltas in a regression note.
- [x] Run Trellis check/finish flow before final response.

## Validation Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec vite --host 127.0.0.1 --port 1421
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1512,900 --screenshot=docs/regression-artifacts/2026-06-12/after-workbench-home.png http://127.0.0.1:1421/
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --hide-scrollbars --window-size=422,768 --screenshot=docs/regression-artifacts/2026-06-12/after-statusbar-panel.png 'http://127.0.0.1:1421/?panel=1'
```
