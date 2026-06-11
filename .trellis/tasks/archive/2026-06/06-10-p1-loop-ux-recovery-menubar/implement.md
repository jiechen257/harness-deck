# Implementation Plan

## Checklist

1. 复用 P0 的 `LoopSummary`。
2. 新增 shared loop stepper/detail/error components。
3. 改造 Practice Library 详情和错误恢复。
4. 改造 Apply & Sync 文案和错误恢复。
5. 改造 Local Review evidence 展示。
6. 改造 MenuBarPanel：
   - real summary
   - safe quick actions
   - open workbench view target
7. 改造 OperationsView：
   - preview-first
   - confirm blocked/available state
   - audit/log section
8. 清理或接通无效 Logo Lab 入口。
9. 更新 tests。

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Risk Points

- MenuBar panel 和 main workbench 是两个窗口，不能把主工作台内容塞进 MenuBar。
- 错误恢复不能吞掉底层 command error。
- 文案不能暗示未授权写入已经执行。

## Rollback

- 保留当前视图结构，按组件级改造。
- Quick actions 失败时降级为打开主窗口。
