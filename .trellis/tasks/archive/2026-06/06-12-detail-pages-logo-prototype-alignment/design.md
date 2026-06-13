# Design

## Scope

This is a frontend-only follow-up to the design screen alignment work. It improves the shared visual system for all detail pages and replaces the product mark.

## Approach

- Update `src/components/shared/HarnessLogo.tsx` to render the exact shard geometry from the prototype HTML, adapted as a reusable React SVG.
- Add/adjust scoped command-deck CSS in `src/styles/app.css` so existing detail view components inherit prototype-like surfaces without rewriting every view's business logic.
- Keep component semantics intact. The detail views keep their existing data loading and UI controls.

## Files

- `src/components/shared/HarnessLogo.tsx`
- `src/styles/app.css`
- optional minimal component markup fixes only if CSS cannot solve a visible mismatch.
- regression note/screenshots under `docs/regression*`.

## Verification

- Browser screenshots:
  - `/` with default home already covered by the previous task.
  - navigate/capture settings and another detail page after this fix.
- Project checks:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
