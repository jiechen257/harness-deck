# 数据库规范

Hone 采用本地优先架构，持久化状态存储在应用数据目录下的 SQLite 和 registry 目录中。

## 应用数据布局

```text
~/Library/Application Support/<bundle app data>/
  hone.db                  # SQLite 主库
  profiles/                # 历史目录，当前仍由 app paths 创建
  manifests/               # manifest/metadata 目录
  backups/                 # projection 写入前备份
  registry-cache/          # starter 或用户选择的 registry-backed local assets 缓存
  feed-cache/              # feed/source 缓存
  suggestions/             # 改进建议缓存
  install-history/         # 安装/投射历史
```

路径解析使用 `app_paths::paths_for_app()`，目录创建必须集中在 app paths/service 层。

## 当前持久化

- SQLite 由 `db::Database::open()` 打开，schema 在 `db/schema.rs` 初始化。
- `seed_authorization()` 写入基础授权范围。
- `intake_service::seed_default_sources()` 写入默认信号源。
- repository 文件按领域拆分：signal、practice、asset、projection、registry、auth、audit、ops、refresh、source config、skill config。
- registry 目录保存可投射资产；SQLite 保存索引、状态、授权、projection 和 audit。

## SQLite 规则

- SQLite 存储索引、状态、信号、实践、资产、projection、授权和审计记录。
- 完整文件内容、秘密值、prompt、source code 和完整日志不进入 SQLite。
- 不存储 API key、provider token、prompt、源代码或完整日志。
- schema 迁移必须是确定性的并有测试覆盖。

## Projection 写入规则

- projection confirm / adopt / rollback 必须在写入前生成 plan 或读取已有 projection 元数据。
- 修改 Claude/Codex target 前必须检查 `write_projection` 授权。
- 写入完成后必须记录 audit event。
- registry asset 和 target path 必须保留可审计引用，避免 UI 只保存展示字符串。
