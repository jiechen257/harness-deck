# P1 闭环 UX 恢复与菜单栏操作

## Goal

在 P0 真实数据基础上，把 Hone 的使用体验从“能跑通”提升到“用户知道当前在哪一步、失败后怎么恢复、菜单栏能作为每日安全入口”。

## Requirements

- 每个对象详情都展示闭环位置：Signal -> Practice -> Asset -> Projection -> Review。
- Signal / Practice / Asset 列表支持对象详情面板或详情区。
- 写入类动作统一用 `Preview Plan` / `Confirm` 表达。
- 空状态必须区分：未授权、未配置 registry、未启用 source、刷新失败、无数据。
- 错误状态必须给出 `Retry` / `Open Settings` / `Copy diagnostics` / `Select registry` 等恢复动作。
- MenuBar 使用真实 `LoopSummary`，显示 pending signals、practice health、drift/orphan/missing、operations status。
- MenuBar quick actions 只执行低风险刷新或打开主窗口对应视图；高风险动作跳主窗口确认。
- Operations 主视图提供预览、确认、日志和审计，不在 Settings 中隐藏。
- 顶部 `Logo Lab` 入口要么接到实际原型/设计评审区，要么移除，不能作为无效按钮留在主 UI。

## Acceptance Criteria

- [ ] 用户点击任意 Signal/Practice/Asset 能看到详情和闭环步骤。
- [ ] 所有写入动作的主按钮文案先表达 preview/plan，再表达 confirm。
- [ ] 未授权 refresh 显示 Open Settings；agent 缺失显示安装/配置提示；skill 失败显示 retry 和 diagnostics。
- [ ] MenuBar 显示真实 summary，不展示长资讯列表。
- [ ] MenuBar 的 `Open Local Review` / `Open Apply & Sync` / `Refresh Signals` 行为可用。
- [ ] Operations 中高风险脚本必须有 preview 和 confirm；MenuBar 不直接运行。
- [ ] 无效 UI 入口被接通或移除。
- [ ] 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`。

## Out Of Scope

- 新视觉方向大改。
- 真实系统脚本执行能力超出已有安全边界。
