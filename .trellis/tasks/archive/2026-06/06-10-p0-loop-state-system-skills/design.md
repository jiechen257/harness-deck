# Technical Design

## Backend

### Schema / Repositories

复用现有 SQLite 分层：

- `src-tauri/src/db/signal_repo.rs`
- `src-tauri/src/db/practice_repo.rs`
- `src-tauri/src/db/asset_repo.rs`
- `src-tauri/src/db/audit_repo.rs`
- `src-tauri/src/db/refresh_repo.rs`
- `src-tauri/src/db/skill_config_repo.rs`

如现有 schema 缺少状态迁移字段或查询，需要补充：

- signal status update
- practice list / insert / status update
- asset list / insert / status update
- summary aggregation query

### Commands

新增或补齐 commands：

```text
list_practices()
create_practice_from_signal(signalId, draft)
list_local_assets()
create_local_asset_from_practice(practiceId, draft)
get_loop_summary()
normalize_signal(signalId, agentKind)
```

`normalize_signal` 由 Rust command 负责：

1. 读取 signal summary。
2. 读取 active registry。
3. 调用 `skill_service::execute_skill(..., "normalize-practice-card", ...)`。
4. 解析 JSON draft。
5. 写 audit。
6. 返回 draft 或结构化错误。

## Frontend

### API Types

在 `src/lib/types.ts` 增加：

- `PracticeCard`
- `PracticeDraft`
- `LocalAsset`
- `LocalAssetDraft`
- `LoopSummary`
- `NormalizeResult`
- `RecoverableError`

`src/lib/api.ts` 增加 Tauri command wrapper，并保留 browser fallback。

### UI

`PracticeLibraryView` 改为真实状态：

- Signal tab：列表 + selected signal + normalize preview。
- Practices tab：真实 cards + status。
- Assets tab：真实 assets + status + path。
- Archived tab：真实 archived objects。

`HomeView` 改为接收 `LoopSummary` 或自行加载 summary，去掉硬编码主数据。

## Error Model

前端显示统一错误状态：

- `authorization_required`
- `agent_unavailable`
- `skill_disabled`
- `skill_failed`
- `parse_failed`
- `storage_error`

每个错误至少给出一个下一步：`Open Settings`、`Retry`、`Select registry`、`Copy diagnostics`。

## Migration

现有 SQLite schema 应使用 `CREATE TABLE IF NOT EXISTS` 和兼容默认值。若需要新增列，使用可重复执行的 migration helper 或兼容查询。
