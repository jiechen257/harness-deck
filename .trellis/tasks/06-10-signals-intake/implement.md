# Hone Signals Intake 执行计划

## Implementation Checklist

1. 在 `db/schema.rs` 添加 `source_configs` 表。
2. 创建 `domain/source_config.rs` — `SourceConfig`。
3. 创建 `db/source_config_repo.rs` — list / get / upsert / set_enabled / set_auto_refresh。
4. 创建 `services/intake_service.rs`：
   - `seed_default_sources(db)` — 7 个内置来源
   - `refresh_source(db, source_id)` — 检查授权 → fetch → 写 signal_cards + refresh_records + audit
   - `refresh_all_enabled(db)` — 遍历 enabled sources
   - 社区来源复用 crawl_service fetch 逻辑转成 signal cards
   - changelog / model_news 首版写入 fixture signal
5. 创建 `commands/intake_commands.rs`：
   - `refresh_signals` / `list_signal_sources` / `toggle_signal_source` / `toggle_auto_refresh`
6. 在 `lib.rs` 注册 commands 和首次启动 seed。
7. 在 `api.ts` / `types.ts` 添加前端类型和 API。
8. 编写测试：
   - seed 默认 sources
   - source config CRUD
   - refresh 写入 signal cards + refresh records
   - 授权检查（未授权时拒绝刷新）
9. `cargo test` + `pnpm typecheck`。

## Validation

```bash
cargo test --manifest-path src-tauri/Cargo.toml -- intake
pnpm typecheck
```

## Rollback

新增文件删除即可。
