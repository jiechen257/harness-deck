# 数据库规范

HarnessDeck 采用本地优先架构，持久化状态存储在应用数据目录下。

## 应用数据布局

```text
~/Library/Application Support/HarnessDeck/
  manifests/               # dry-run 部署 manifest（JSON）
  backups/                 # 未来的备份快照
  registry-cache/          # 未来的注册表缓存
  feed-cache/              # 未来的 feed 缓存
```

路径解析使用 `app_paths::paths_for_app()`：

```rust
// src-tauri/src/services/app_paths.rs
pub fn paths_for_app<R: Runtime>(app: &AppHandle<R>) -> Result<AppPaths, CommandError> {
    let base = app.path().app_data_dir().map_err(CommandError::from)?;
    Ok(AppPaths {
        base: base.clone(),
        manifests: base.join("manifests"),
        backups: base.join("backups"),
    })
}
```

## 当前持久化

- Dry-run manifest 是由 `storage_service::write_dry_run_manifest` 写入 `manifests/` 的 JSON 文件。
- 配置集 fixture 硬编码在 `profile_service.rs` 中，不从磁盘加载。
- 当前阶段无 SQLite 或 Keychain。

## 未来 SQLite 规则

- 在 SQLite 中存储索引、状态、用量聚合、feed 缓存、洞察和审计记录。
- 完整部署 manifest 作为文件存储；仅可索引的元数据放入 SQLite。
- 不存储 API key、provider token、prompt、源代码或完整日志。
- 迁移必须是确定性的并有测试覆盖。

## 备份规则

- 未来的真实写入路径必须在写入前创建备份。
- 部署 manifest 必须在写入完成前包含备份元数据。
- 当前阶段仅展示备份设计和禁用的 UI 状态。
