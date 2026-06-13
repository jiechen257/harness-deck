# Fix prototype alignment for detail pages and logo

## Goal

Bring the five non-home workbench menu pages closer to `docs/product-design/screens/workbench-home.html` and replace the current product logo with the prototype shard SVG used in that HTML.

## Requirements

- Replace the reusable product logo with the shard mark from `workbench-home.html` / `statusbar-panel.html`.
- Ensure the logo renders consistently in:
  - workbench rail brand;
  - rail workflow card;
  - statusbar panel header;
  - any existing shared `HarnessLogo` usage.
- Fix the five menu/detail pages so they do not look like old floating panels inside the new command deck shell:
  - Practice Library;
  - Apply & Sync;
  - Local Review;
  - Operations;
  - Settings.
- Align detail page layout with the prototype embedded sections in `workbench-home.html`:
  - title row with mono kicker, large title, and compact actions;
  - module/card surfaces using the same border, radius, background, and density;
  - tabs, rows, forms, projection board, review strip, operations cards, and settings grids styled like the prototype;
  - content remains scrollable in the center stage without overlapping the left rail.
- Keep existing app behavior and tests:
  - navigation labels and `aria-current`;
  - brand menu locale/theme actions;
  - `?panel=1` statusbar route;
  - fixture/Tauri data paths.

## Acceptance Criteria

- [ ] The shared logo uses the prototype shard SVG, not the old fader icon.
- [ ] All five non-home views visually fit the command deck prototype style.
- [ ] The highlighted left rail area from the user screenshot no longer appears as a disconnected old-shell/detail-page mismatch.
- [ ] Browser screenshots for at least `settings` plus one additional detail page are captured under `docs/regression-artifacts/2026-06-12/`.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.

## Notes

- Do not touch unrelated dirty files already present in the worktree.
- Use the existing React view components and CSS; no new runtime dependencies.
