# Implementation Plan

## Execution Order

1. 完成并启动 `06-10-p0-loop-state-system-skills`。
2. 完成并启动 `06-10-p0-apply-sync-confirmation`。
3. 完成并启动 `06-10-p1-loop-ux-recovery-menubar`。
4. 完成并启动 `06-10-p2-sources-registry-diff-adapter`。
5. 回到父任务做集成验证和最终归档。

## Parent Review Gates

- 每个子任务启动前必须有 `prd.md`、`design.md`、`implement.md`。
- 每个子任务完成前至少运行与风险匹配的验证。
- 父任务最终验证必须运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## Current Dirty Worktree

当前存在 6 个未提交 UI 文件：

- `src/App.tsx`
- `src/components/views/ApplySyncView.tsx`
- `src/components/views/LocalReviewView.tsx`
- `src/components/views/PracticeLibraryView.tsx`
- `src/components/views/SettingsView.tsx`
- `src/styles/app.css`

实现时必须接续这些改动，不能还原。

## Start Target

首个实现目标是：

```bash
python3 ./.trellis/scripts/task.py start 06-10-p0-loop-state-system-skills
```

启动前需要用户确认规划文档。
