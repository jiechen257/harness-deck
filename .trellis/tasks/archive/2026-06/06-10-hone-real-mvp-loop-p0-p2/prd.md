# Hone 真实 MVP 闭环 P0-P2

## Goal

把当前 Hone 从“定位正确的高保真工作台壳 + 局部真实后端能力”推进到真实可用的本地优先 MVP 闭环，并完成 P0、P1、P2 范围内的功能和交互优化。

完整闭环必须能被用户从 UI 中实际跑通：

```text
Refresh Signals
  -> Normalize Practice Card
  -> Generate / Link Local Asset
  -> Preview Apply & Sync
  -> Confirm Projection / Adopt
  -> Local Review
  -> Audit / MenuBar status
```

## Source Requirements

本任务继承并落地归档任务：

- `.trellis/tasks/archive/2026-06/06-09-hone-core-rewrite/prd.md`
- `.trellis/tasks/archive/2026-06/06-10-hone-positioning-practice-loop/prd.md`
- `.trellis/tasks/archive/2026-06/06-10-product-prototype/prd.md`

用户明确要求完成前一轮评估中的 P0 到 P2 全部内容。

## Current Baseline

- 当前主导航已调整为 `Home / Practice Library / Apply & Sync / Local Review / Operations / Settings`。
- Home、Practice Library、Apply & Sync、Local Review、Settings、MenuBar 的信息架构方向基本符合“本地 harness practice 运营台”。
- Rust 侧已有 SQLite、authorization、registry、projection plan、symlink、adopt、rollback、audit、system skill、BYOA 的部分实现。
- 当前断点是：Home/MenuBar 大量数字仍是静态数据，signals intake 仍生成 fixture，Practice Card 状态机和 Local Asset 生成没有真实持久化，Apply & Sync 的确认/adopt/rollback 前端没有完整接通。

## Task Map

- `06-10-p0-loop-state-system-skills`
  - 真实闭环状态机
  - Signal -> Practice Card -> Local Asset 的 SQLite 持久化
  - System Practice Skill 执行和结果落库
  - Home 状态聚合
- `06-10-p0-apply-sync-confirmation`
  - Apply & Sync 真实预览、确认、冲突、adopt、rollback、audit 流
  - Claude Code + Codex target 的安全投射
- `06-10-p1-loop-ux-recovery-menubar`
  - 闭环导览、对象详情、错误恢复、空状态、菜单栏安全快捷入口
  - Operations 预览/确认体验
- `06-10-p2-sources-registry-diff-adapter`
  - 官方/社区 source 分层
  - Registry bootstrap
  - Diff viewer
  - Drift timeline
  - Adapter capability 状态

## Requirements

- MVP 必须本地优先，不依赖服务端。
- 默认不自动联网；外部 source refresh 需要 `external_signals` 授权。
- 默认不真实写入 target；projection/adopt/rollback 必须先展示计划并由用户确认。
- Claude Code 和 Codex 是 MVP 唯一真实同步目标。
- Signal Card、Practice Card、Local Asset、Projection、Audit 必须有清晰状态和关系。
- SQLite 保存结构化摘要、状态、关系和审计，不保存完整网页、完整 thread、本地源码/logs 或 secrets。
- System Practice Skill 可以使用本地 Claude/Codex 执行，但必须可失败、可重试、可审计。
- MenuBar 只能展示待处理闭环状态和安全入口，不自动 normalize/install/write。
- UI 保持中文默认、英文可切换、浅色默认、深色可切换。
- 现有用户改动不得被还原；当前 6 个未提交 UI 文件需要在实现中保留并接续。

## Acceptance Criteria

- [ ] 用户能在 Practice Library 点击刷新，看到真实落库的 Signal Card，并能区分 official / community / confidence / fetchedAt / publishedAt。
- [ ] 用户能从 Signal 生成 Practice Card 预览，确认后落库并更新状态。
- [ ] 用户能从 Practice Card 生成或关联 Local Asset draft，并进入 Apply & Sync。
- [ ] Apply & Sync 能展示真实 projection plan，包括 create / update / skip / conflict、symlink / copy fallback、registry path、target path。
- [ ] 用户确认后能执行 symlink projection；冲突不覆盖普通文件/目录。
- [ ] 用户能逐项 adopt 未托管 target asset，并在确认前看到 source、registry destination、backup path、target symlink。
- [ ] 用户能 rollback projection，且只删除 target link，不删除 registry 源文件。
- [ ] Local Review 能显示真实 broken symlink、missing projection、drift、orphan、redundant、replacement 结果或明确说明未扫描/未授权。
- [ ] Home 和 MenuBar 的数量、健康度、待处理队列来自真实 SQLite / service 聚合，不再使用硬编码主数据。
- [ ] Settings 能展示和修改 registry、authorization、audit 状态；首次授权边界清晰。
- [ ] Operations 高风险动作不在 MenuBar 直接执行；主窗口必须预览并确认。
- [ ] UI 具备错误恢复：未授权、CLI 不存在、system skill 失败、source refresh 失败、projection conflict 都有可执行下一步。
- [ ] P0/P1/P2 子任务均通过各自验证并归档。
- [ ] 全量验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`cargo test --manifest-path src-tauri/Cargo.toml`。

## Out Of Scope

- Windows / Linux 支持。
- 远端服务、账号系统、云同步。
- 真实发布到 GitHub Release 或 Homebrew。
- Cursor、Windsurf、Claude Desktop 的真实写入支持。
- 自动执行高风险脚本或自动安装资产。

## Open Questions

无阻塞问题。默认采用安全本地优先策略：所有联网、写入、脚本执行都需要授权和确认。
