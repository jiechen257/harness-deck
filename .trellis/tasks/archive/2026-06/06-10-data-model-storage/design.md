# Hone 数据模型与本地持久化设计

## Scope

本子任务新增 Hone 的 SQLite 数据库（`hone.db`），定义核心实体 schema，实现 Rust 端的数据库初始化、基础 CRUD 和 audit 写入。不实现 UI 联调、真实爬取或真实 agent 调用。

## Architecture

### 双层真相模型

```text
SQLite (hone.db)
  -> Signal Card / Practice Card metadata、关系、状态、决策
  -> Local Asset metadata、projection state、checksum
  -> Operations Script 注册、执行记录
  -> Audit event log
  -> Authorization state
  -> Registry connection config

Registry Repo (用户本地 Git 仓库)
  -> Skill / Rule / Hook / MCP 文件资产（真相来源）

Target Dirs (~/.claude/ , ~/.codex/)
  -> 投射结果（symlink 或 copy）
```

SQLite 不保存：完整网页正文、完整 changelog 原文、完整 thread dump、完整本地源码/logs、secrets。

### 数据库位置

```text
macOS: ~/Library/Application Support/com.hone.app/hone.db
开发/测试: 可用 :memory: 或临时路径
```

通过 Tauri 的 `app_data_dir()` 获取，在 `HarnessDeckPaths` 中新增 `db` 字段。

## Schema

### signal_cards

```sql
CREATE TABLE signal_cards (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  source_url    TEXT,
  source_tier   TEXT NOT NULL CHECK(source_tier IN ('official','maintainer','community')),
  signal_type   TEXT NOT NULL CHECK(signal_type IN ('changelog','model_news','community_discussion','product_update')),
  impact        TEXT NOT NULL DEFAULT 'medium' CHECK(impact IN ('high','medium','low')),
  confidence    TEXT NOT NULL DEFAULT 'unverified' CHECK(confidence IN ('confirmed','unverified','community_reported')),
  excerpt       TEXT,
  published_at  TEXT,
  fetched_at    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'inbox' CHECK(status IN ('inbox','processing','normalized','archived','dismissed')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### practice_cards

```sql
CREATE TABLE practice_cards (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  practice_type TEXT NOT NULL CHECK(practice_type IN ('product','skill','mcp','workflow','methodology')),
  summary       TEXT,
  scenarios     TEXT,       -- JSON array
  comparable    TEXT,       -- JSON array
  applicability TEXT,       -- JSON: { canGenerateAsset: bool, targetTypes: [...] }
  generated_by  TEXT,       -- system skill id + version
  status        TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','adoptable','applied','outdated','archived')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### signal_practice_links

```sql
CREATE TABLE signal_practice_links (
  signal_id   TEXT NOT NULL REFERENCES signal_cards(id),
  practice_id TEXT NOT NULL REFERENCES practice_cards(id),
  created_at  TEXT NOT NULL,
  PRIMARY KEY (signal_id, practice_id)
);
```

### local_assets

```sql
CREATE TABLE local_assets (
  id              TEXT PRIMARY KEY,
  practice_id     TEXT REFERENCES practice_cards(id),
  asset_type      TEXT NOT NULL CHECK(asset_type IN ('skill','mcp_config','rule','hook','agent_profile_fragment')),
  registry_path   TEXT NOT NULL,   -- 相对于 registry root
  checksum        TEXT,
  is_system       INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','pending','broken','archived')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

### projections

```sql
CREATE TABLE projections (
  id            TEXT PRIMARY KEY,
  asset_id      TEXT NOT NULL REFERENCES local_assets(id),
  target_kind   TEXT NOT NULL CHECK(target_kind IN ('claude_code','codex')),
  target_path   TEXT NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'symlink' CHECK(mode IN ('symlink','copy')),
  status        TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','broken','drifted','removed')),
  last_checked  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### operations_scripts

```sql
CREATE TABLE operations_scripts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  path        TEXT NOT NULL,
  description TEXT,
  risk_level  TEXT NOT NULL DEFAULT 'medium' CHECK(risk_level IN ('low','medium','high')),
  status      TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','running','idle','disabled')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### audit_events

```sql
CREATE TABLE audit_events (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  detail      TEXT,           -- JSON
  outcome     TEXT NOT NULL DEFAULT 'success' CHECK(outcome IN ('success','failure','skipped','cancelled')),
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_events(created_at);
```

### registry_connections

```sql
CREATE TABLE registry_connections (
  id            TEXT PRIMARY KEY,
  path          TEXT NOT NULL,
  registry_type TEXT NOT NULL DEFAULT 'user' CHECK(registry_type IN ('user','starter','initialized')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### authorization_state

```sql
CREATE TABLE authorization_state (
  scope       TEXT PRIMARY KEY CHECK(scope IN ('registry','local_read','external_signals','write_projection','script_execution')),
  granted     INTEGER NOT NULL DEFAULT 0,
  granted_at  TEXT,
  revoked_at  TEXT
);
```

### refresh_records

```sql
CREATE TABLE refresh_records (
  id            TEXT PRIMARY KEY,
  source_name   TEXT NOT NULL,
  source_url    TEXT,
  triggered_by  TEXT NOT NULL DEFAULT 'manual' CHECK(triggered_by IN ('manual','scheduled')),
  result_count  INTEGER,
  error_message TEXT,
  outcome       TEXT NOT NULL DEFAULT 'success' CHECK(outcome IN ('success','failure','partial')),
  started_at    TEXT NOT NULL,
  finished_at   TEXT
);
```

## Rust 模块结构

```text
src-tauri/src/
  db/
    mod.rs          -- pub mod; Database struct + init + migrate
    schema.rs       -- CREATE TABLE SQL constants + migration
    signal_repo.rs  -- Signal CRUD
    practice_repo.rs
    asset_repo.rs
    projection_repo.rs
    ops_repo.rs     -- Operations scripts CRUD
    audit_repo.rs
    registry_repo.rs
    auth_repo.rs
    refresh_repo.rs
```

### Database struct

```rust
pub struct Database {
    conn: rusqlite::Connection,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, CommandError>;
    pub fn open_in_memory() -> Result<Self, CommandError>;
    pub fn migrate(&self) -> Result<(), CommandError>;
}
```

所有 repo 函数接收 `&Database` 引用，不持有 Connection 所有权。Tauri 中通过 `app.manage(Mutex<Database>)` 共享。

## Constraints

- 所有 ID 使用 `ulid` crate 生成（时间有序、无外部依赖）。
- 所有时间戳使用 ISO 8601 TEXT（`chrono::Utc::now().to_rfc3339()`）。
- JSON 列使用 `serde_json::Value` 序列化为 TEXT。
- `#[serde(rename_all = "camelCase")]` 用于所有 domain struct。
- 测试使用 `open_in_memory()` 避免文件副作用。
- 首版不做 WAL mode 或并发写入优化。
