# P0 真实闭环状态机与 System Practice Skill

## Goal

让 Hone 的核心对象从静态 UI 数据变成真实可持久化、可推进状态、可由 System Practice Skill 生成结果的闭环前半段：

```text
Signal Card -> Normalize -> Practice Card -> Local Asset draft / ready -> Home summary
```

## Requirements

- Practice Library 的 Signal、Practice、Asset、Archived 数据来自 SQLite / Tauri command，而不是组件内静态数组。
- Refresh Signals 必须写入 `signals` 表，并记录 refresh/audit。
- Signal 可以进入 normalize flow，调用 `normalize-practice-card` system skill 或在不可用时给出明确失败状态。
- Normalize 结果可以被用户确认并保存为 Practice Card。
- Practice Card 可以生成或关联 Local Asset draft，并写入 SQLite。
- Home 必须读取真实 loop summary 聚合，不再以硬编码数字作为主数据。
- System Practice Skill 执行必须记录 success/failure、duration、agent kind、错误原因和 audit。
- 浏览器 fallback 可以保留，但要清楚标记 fixture mode；真实验收以 Tauri command 为准。
- 未授权 external signals、未授权 local_read、未安装 Claude/Codex、system skill disabled 等状态必须在 UI 中可见。

## Acceptance Criteria

- [ ] `PracticeLibraryView` 初始加载真实 signals / practices / assets / archived counts。
- [ ] 点击 `Refresh Signals` 后，若已授权 external_signals，则 SQLite 新增 Signal Card 和 audit；若未授权，UI 显示可恢复错误并链接 Settings 授权。
- [ ] 点击某条 Signal 能打开 normalize preview，而不是固定静态预览。
- [ ] 点击 `Generate Preview` 会调用 system skill；成功后展示 Practice Card draft，失败后展示错误和 retry。
- [ ] 用户确认 draft 后，Practice Card 写入 SQLite，Signal 状态更新为 normalized。
- [ ] 用户能从 Practice Card 创建 Local Asset draft 或 ready record。
- [ ] Home 状态矩阵、决策队列和审计轨迹来自 `get_loop_summary` 聚合。
- [ ] MenuBar 后续可复用同一 summary contract。
- [ ] 新增/更新的 Rust domain 结构体使用 `#[serde(rename_all = "camelCase")]`。
- [ ] 前端无 `any`，TS 类型与 Rust serde contract 对齐。
- [ ] 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`cargo test --manifest-path src-tauri/Cargo.toml`。

## Out Of Scope

- 真实 projection 写入；由 `p0-apply-sync-confirmation` 负责。
- P2 的真实官方 source 抓取和 diff viewer。
- 自动运行每日 refresh。
