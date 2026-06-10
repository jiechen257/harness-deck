# Hone Signals Intake 信息源接入

## Goal

实现 Hone 的 `Signal Card` 输入管道，覆盖社区实践、Codex / Claude Code 产品 changelog 和模型最新讯息，同时保持本地优先、默认手动刷新和可信度分层。

## Requirements

- 信息源分为三类：
  - 社区实践：GitHub Trending、linux.do、Hacker News、Reddit 等。
  - 产品 changelog：Codex 桌面端、Claude Code 等核心工具的功能更新。
  - 模型讯息：新模型发布、能力边界、工具调用能力、上下文窗口、价格 / 限额变化、可用区域和客户端支持状态。
- 默认首次启动不自动联网。
- 用户手动点击 `Refresh Signals` 才访问外部来源。
- 用户可显式开启本地每日定时刷新。
- 每个 source 可独立开关。
- 每次刷新记录来源、时间、成功 / 失败、结果数量和错误原因。
- 模型事实必须有 Official 来源才标记 `confirmed`。
- `Maintainer / Repository` 和 `Community` 只能作为 Signal，不直接作为模型事实结论。
- Signal Card 可被 system skill 转化或关联到 Practice Card。

## Acceptance Criteria

- [ ] Signal Card 包含 source、url、published_at、fetched_at、source tier、confidence、status。
- [ ] Codex / Claude Code changelog 与社区信号清楚区分。
- [ ] 模型讯息遵守 Official / Maintainer / Community 三层可信度。
- [ ] 默认手动刷新，不在首次启动自动联网。
- [ ] opt-in daily refresh 可按 source 独立开关。
- [ ] 不保存完整网页、完整 changelog 原文或完整 thread dump。

## Dependencies

- 父任务：`.trellis/tasks/06-10-hone-positioning-practice-loop/prd.md`。
- 依赖 `data-model-storage` 的 Signal Card、source refresh record 和 audit 设计。
- 可与 `product-prototype` 并行使用 fixture signal 数据验证 UI。
- 顺序依赖：真实外部来源接入放在 `apply-sync-registry` 之后，避免产品实现优先级再次偏向 crawler。

## Notes

- 实现前需要补 `design.md` 和 `implement.md`。
