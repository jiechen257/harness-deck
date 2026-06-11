# Technical Design

## Architecture

父任务不直接实现代码，负责定义跨子任务的真实 MVP 闭环和集成边界。实现分布在四个子任务中，顺序如下：

```text
1. P0 loop-state-system-skills
   建立真实对象状态机、聚合 API 和 system skill 执行闭环

2. P0 apply-sync-confirmation
   将 Local Asset 和 Projection 服务接成可确认写入流

3. P1 loop-ux-recovery-menubar
   在真实数据基础上完善交互、错误恢复、菜单栏和 Operations

4. P2 sources-registry-diff-adapter
   增强 source、registry bootstrap、diff、drift timeline 和 adapter 状态
```

## Cross-Task Contracts

### Domain Objects

- `SignalCard`
  - 输入事实信号，状态至少覆盖 `inbox`、`normalizing`、`normalized`、`archived`、`failed`。
- `PracticeCard`
  - 沉淀实践，状态至少覆盖 `draft`、`ready`、`assetPending`、`assetReady`、`applied`、`archived`。
- `LocalAsset`
  - 可投射资产，状态至少覆盖 `draft`、`ready`、`projected`、`drifted`、`orphaned`、`archived`。
- `Projection`
  - target 投射记录，状态至少覆盖 `previewed`、`active`、`conflict`、`removed`、`failed`。
- `AuditEvent`
  - 所有 refresh、normalize、asset generation、projection、adopt、rollback、authorization、script preview/run 都写审计。

### Frontend Data Flow

React 组件通过 `src/lib/api.ts` 访问 Tauri command。浏览器开发模式允许 fallback，但真实 MVP 验收必须以 Tauri command / SQLite 为准。

Home 和 MenuBar 不再自己维护硬编码数字；统一从后端聚合 command 读取：

```text
get_loop_summary()
  -> signal counts
  -> practice counts
  -> asset counts
  -> review finding counts
  -> operations status
  -> latest audit
```

### Safety Boundaries

- 所有真实写入在 Rust 服务中执行。
- 前端只能提交用户确认后的 action intent。
- 任何 target 普通文件/目录冲突默认 `conflict`，不能覆盖。
- Adopt 失败必须保留原始 target 资产。
- Rollback 只删除 target symlink，不删除 registry 源文件。

## Compatibility

- 保留 `pnpm dev` 的 browser fallback，用于开发和测试。
- 保留 Tauri 2 双窗口架构。
- 保留 zh-CN / en-US、light / dark、macOS native-feel。
- 旧 `DiscoverView`、`UsageView`、`InsightsView` 可以在具体子任务中删除或停止导出，前提是测试和路由不再依赖。

## Rollback

每个子任务必须可独立回滚：

- Schema 变更需有向后兼容默认值。
- 新 command 若失败，前端显示不可用状态，不阻断其他视图。
- 文件写入类功能只能在确认后执行，并有 audit trail 支持手工排查。
