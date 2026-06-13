# 数据库规范

Hone 采用本地优先架构。SQLite 保存结构化状态，registry repo 保存可投射文件资产。

## 应用数据

应用路径由 `services::app_paths::paths_for_app()` 解析。SQLite 数据库文件为 `hone.db`。

当前核心表：

- `signal_cards`
- `practice_cards`
- `signal_practice_links`
- `local_assets`
- `projections`
- `audit_events`
- `registry_connections`
- `authorization_state`
- `refresh_records`
- `system_skill_configs`
- `source_configs`
- `operations_scripts`

## Registry

- active registry 由 `registry_connections` 记录。
- `LocalAsset.registry_path` 指向 registry 内路径。
- 有 writable active registry 时，`create_local_asset_from_practice` 必须 materialize 文件或目录，使 projection planner 能找到真实 source。
- `starter://bundled` 只能作为只读 starter，不承载用户生成资产。

## 隐私边界

- SQLite 不保存 API key、provider token、完整 prompt、源代码或完整日志。
- secrets 走 Keychain 边界；当前只保存引用或状态。
- audit 记录事件、实体、结果和安全摘要，不保存秘密值。

## Migration

- schema migration 必须可重复、确定性执行。
- 新表或字段必须有测试覆盖。
