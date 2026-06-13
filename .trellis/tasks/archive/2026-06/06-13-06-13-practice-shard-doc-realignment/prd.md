# Realign docs to Practice Shard workbench design

## Goal

Realign current project documentation to the Practice Shard workbench design:

`docs/product-design/screens/workbench-home.html`

This design is the active product surface. The previous README-centered 5-view interpretation was incorrect.

## Requirements

- Treat `docs/product-design/screens/workbench-home.html` as the product/UI source of truth.
- Preserve the 6 current workbench views:
  - 首页 / Home
  - 实践库 / Practice Library
  - 应用与同步 / Apply & Sync
  - 本地评审 / Local Review
  - 运维 / Operations
  - 设置 / Settings
- Preserve the current product loop:
  - signal intake
  - practice draft / Practice Card
  - local asset
  - registry projection
  - local review / drift evidence
  - operations preview and confirmation
  - settings authorization and audit
- Rewrite docs that still claim README's 5-view route, `Discover -> Apply -> Observe -> Optimize` as the implemented workbench, or `Usage/Insights` as primary views.
- Rewrite or mark down old Profile-first docs so they do not override the Practice Shard workbench.
- Do not change frontend or backend behavior in this task unless a documentation reference is impossible to make truthful without a tiny rename.
- Keep Chinese as the primary documentation language and English README aligned.

## Acceptance Criteria

- [x] `README.md`, `README.en.md`, `AGENTS.md`, and `CLAUDE.md` agree on the 6-view Practice Shard workbench.
- [x] `docs/product-design/README.md` states that `workbench-home.html` and `statusbar-panel.html` are current design references.
- [x] `.trellis/spec/frontend/*` reflects the current 6-view App shell and existing files.
- [x] `.trellis/spec/backend/*` reflects current SQLite/registry/BYOA/projection/audit architecture.
- [x] Stale Profile-first product specs are clearly marked as superseded by Practice Shard or rewritten so they cannot be mistaken for current product authority.
- [x] A repo markdown search confirms no active-current docs still claim 5 primary views or README as the sole authority.
- [x] Documentation validation and minimal project checks pass.

## Notes

- This task intentionally avoids the UI/backend changes from reverted commit `101e624`.
