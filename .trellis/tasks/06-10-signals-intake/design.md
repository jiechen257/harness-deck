# Hone Signals Intake 设计

## Scope

实现 Signal Card 的输入管道 service：source 配置、手动/定时刷新触发、signal 写入 SQLite、refresh 记录、source tier 标记。首版复用现有 `crawl_service` 的社区爬取能力，新增 changelog/model signal 类型和可信度分层。不改 UI。

## Architecture

### Signal 来源类型

```text
SourceConfig {
  id: String,
  name: String,
  source_type: "community" | "changelog" | "model_news",
  source_tier: "official" | "maintainer" | "community",
  url: Option<String>,
  enabled: bool,
  auto_refresh: bool,
}
```

### 内置 Source 配置

```text
github-trending     community     community     手动
hackernews          community     community     手动
reddit-ai-coding   community     community     手动
linux-do            community     community     手动
codex-changelog     changelog     official      手动
claude-code-log     changelog     official      手动
model-news          model_news    official      手动
```

### 刷新流程

```text
1. intake_service::refresh_source(db, source_id)
   -> 检查 authorization_state("external_signals")
   -> 根据 source_type 调用对应 fetcher
   -> 写入 signal_cards（excerpt + metadata，不存完整正文）
   -> 写入 refresh_records
   -> 写入 audit

2. intake_service::refresh_all_enabled(db)
   -> 遍历 enabled sources，逐个 refresh

3. 社区来源复用 crawl_service 的 fetch 逻辑
4. changelog/model_news 首版使用 fixture 数据（真实爬取需要特定 API/RSS）
```

### 数据库扩展

新增 `source_configs` 表：

```sql
CREATE TABLE IF NOT EXISTS source_configs (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  source_type   TEXT NOT NULL,
  source_tier   TEXT NOT NULL,
  url           TEXT,
  enabled       INTEGER NOT NULL DEFAULT 0,
  auto_refresh  INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL
);
```

## Rust 模块

```text
services/intake_service.rs
  -> refresh_source / refresh_all_enabled / seed_default_sources

db/source_config_repo.rs
  -> list / get / set_enabled / set_auto_refresh

commands/intake_commands.rs
  -> refresh_signals / list_sources / toggle_source / toggle_auto_refresh
```
