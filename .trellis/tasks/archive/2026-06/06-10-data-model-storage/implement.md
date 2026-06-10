# Hone 数据模型执行计划

## Implementation Checklist

1. 在 `Cargo.toml` 添加 `ulid` 和 `chrono` 依赖（rusqlite 已存在）。
2. 在 `HarnessDeckPaths` 新增 `db: PathBuf` 字段，指向 `hone.db`。
3. 创建 `src-tauri/src/db/mod.rs`：
   - `Database` struct，封装 `rusqlite::Connection`。
   - `open(path)` / `open_in_memory()` 构造函数。
   - `migrate()` 方法，执行 schema 创建。
4. 创建 `src-tauri/src/db/schema.rs`：
   - 所有 CREATE TABLE 语句作为 `const &str`。
   - `MIGRATIONS: &[&str]` 数组。
5. 创建 domain structs（如果现有 domain 不匹配新模型，新建文件）：
   - `domain/signal.rs` — `SignalCard`
   - `domain/practice.rs` — `PracticeCard`
   - `domain/local_asset.rs` — `LocalAsset`
   - `domain/projection.rs` — `Projection`
   - `domain/ops_script.rs` — `OpsScript`
   - `domain/audit.rs` — `AuditEvent`
   - `domain/auth_state.rs` — `AuthorizationState`
   - `domain/refresh.rs` — `RefreshRecord`
6. 创建 repo 模块，每个实现基础 CRUD：
   - `db/signal_repo.rs` — insert / get / list / update_status
   - `db/practice_repo.rs` — insert / get / list / link_signal
   - `db/asset_repo.rs` — insert / get / list_by_practice / update_status
   - `db/projection_repo.rs` — insert / get / list_by_asset / update_status
   - `db/ops_repo.rs` — insert / get / list / update_status
   - `db/audit_repo.rs` — insert / list_by_entity / list_recent
   - `db/auth_repo.rs` — get_all / grant / revoke
   - `db/registry_repo.rs` — insert / get_active / set_active
   - `db/refresh_repo.rs` — insert / list_recent
7. 在 `lib.rs` 中初始化 `Database`，通过 `app.manage(Mutex<Database>)` 注入。
8. 新增 Tauri commands 暴露给前端（薄封装层）：
   - `get_authorization_state` / `grant_authorization` / `revoke_authorization`
   - `get_registry_connection` / `set_registry_connection`
   - `list_audit_events`
9. 在 `api.ts` 和 `types.ts` 添加 TypeScript 类型和 invoke 封装。
10. 编写 Rust 测试覆盖：
    - schema 初始化（`open_in_memory` + `migrate`）
    - Signal CRUD
    - Practice CRUD + signal link
    - Asset + Projection CRUD
    - Audit 写入和查询
    - Authorization 状态切换
    - 隐私边界：不存储超过 excerpt 长度的正文
11. 运行 `cargo test` 和 `pnpm typecheck` 验证。

## Validation

Rust 测试：

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

TypeScript 类型检查：

```bash
pnpm typecheck
```

结构检查：

```bash
ls src-tauri/src/db/
rg -l 'Database|migrate|open_in_memory' src-tauri/src/db/
```

## Risk Points

- 现有 `storage_service.rs` 使用 JSON 文件存储 manifest，需要确认是否并行保留还是迁移。首版保持并行，不删除现有存储。
- rusqlite `Connection` 不是 `Send + Sync`，需要用 `Mutex<Database>` 管理 Tauri 共享状态。
- 现有 domain 类型（`registry.rs`、`manifest.rs` 等）和新模型部分重叠，首版新建文件而非重构旧类型，避免破坏现有功能。
- `ulid` 和 `chrono` 是新增 Cargo 依赖，需要确认和 rusqlite 的版本兼容性。

## Rollback

本任务只新增文件（`db/` 模块、新 domain structs、新 Tauri commands）。回滚时删除新增文件，移除 `lib.rs` 中的 `Database` 初始化和 command 注册即可。
