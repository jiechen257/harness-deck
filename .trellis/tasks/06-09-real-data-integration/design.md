# 技术设计：真实数据接入

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│  React 前端                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ api.ts   │ │ views/*  │ │ types.ts │             │
│  │ (invoke) │ │ (展示层)  │ │ (新类型)  │             │
│  └────┬─────┘ └──────────┘ └──────────┘             │
│       │ Tauri IPC                                    │
├───────┼─────────────────────────────────────────────┤
│  Rust 后端                                           │
│  ┌────┴─────┐                                        │
│  │ commands │ ← 新增/修改 command handlers            │
│  └────┬─────┘                                        │
│  ┌────┴─────┐                                        │
│  │ services │ ← 核心变更层：fixture → real reader     │
│  └────┬─────┘                                        │
│  ┌────┴─────┐  ┌────────────┐                        │
│  │ readers/ │  │ domain/    │                         │
│  │ (新模块)  │  │ (类型扩展)  │                         │
│  └────┬─────┘  └────────────┘                        │
│       │                                              │
├───────┼─────────────────────────────────────────────┤
│  文件系统 (只读)                                      │
│  ~/.claude/  ~/.codex/  ~/Library/Application Support │
└─────────────────────────────────────────────────────┘
```

## 新增模块：`readers/`

在 `src-tauri/src/` 下新增 `readers/` 模块，职责是从文件系统读取并解析外部配置文件。与 `services/` 分离，保持单一职责。

```
src-tauri/src/readers/
├── mod.rs
├── claude_reader.rs      # 读取 ~/.claude/ 下的所有 JSON/JSONL
├── codex_reader.rs       # 读取 ~/.codex/ 下的 TOML/JSON/SQLite
├── skill_scanner.rs      # 扫描 skill 目录，提取 SKILL.md 元数据
└── sanitizer.rs          # 脱敏工具：env var、path、secret 过滤
```

### claude_reader.rs

```rust
pub struct ClaudeConfig {
    pub settings: Option<ClaudeSettings>,       // ~/.claude/settings.json
    pub mcp_servers: Vec<McpServerEntry>,        // ~/.claude.json → mcpServers
    pub startup_count: u32,                      // ~/.claude.json → numStartups
    pub stats: Option<ClaudeStats>,              // ~/.claude/stats-cache.json
    pub active_sessions: Vec<ActiveSession>,     // ~/.claude/sessions/*.json
    pub plugins: Vec<PluginEntry>,               // ~/.claude/plugins/installed_plugins.json
    pub project_count: usize,                    // ~/.claude/projects/ dir count
    pub skill_count: usize,                      // ~/.claude/skills/ dir count
}

pub fn read_claude_config(home: &Path) -> ClaudeConfig { ... }
```

关键设计决策：
- 使用 `serde_json::Value` 做松散解析，再提取需要的字段——不定义完整的 ~/.claude.json schema（该文件结构随 Claude Code 版本变化）
- `env` 字段中匹配 `TOKEN|KEY|SECRET|PASSWORD` 的值替换为 `[REDACTED]`
- 文件不存在时返回 `None`/`Vec::new()`，不 panic

### codex_reader.rs

```rust
pub struct CodexConfig {
    pub config: Option<CodexTomlConfig>,         // ~/.codex/config.toml
    pub agents_md_exists: bool,                  // ~/.codex/AGENTS.md
    pub version: Option<String>,                 // ~/.codex/version.json
    pub thread_count: u32,                       // state_5.sqlite → COUNT(*)
    pub recent_threads: Vec<CodexThread>,        // state_5.sqlite → 最近 20 条
    pub skill_count: usize,                      // ~/.codex/skills/ dir count
    pub session_count: usize,                    // session_index.jsonl 行数
    pub memory_size_bytes: u64,                  // memories/MEMORY.md 文件大小
}

pub fn read_codex_config(home: &Path) -> CodexConfig { ... }
```

关键设计决策：
- TOML 解析用 `toml` crate
- SQLite 读取用 `rusqlite`（只读模式 `SQLITE_OPEN_READ_ONLY`），不写入
- `auth.json` 和 `.env` 不读取
- `config.toml` 中的 auth/token 相关字段脱敏

### skill_scanner.rs

```rust
pub struct SkillMeta {
    pub name: String,          // 目录名
    pub title: Option<String>, // SKILL.md 第一行 # 标题
    pub description: Option<String>, // 标题后的首段文本
    pub source: String,        // "claude" | "codex"
}

pub fn scan_skills(dir: &Path, source: &str) -> Vec<SkillMeta> { ... }
```

- 只读 SKILL.md 的前 20 行，提取标题和描述
- 跳过 `.git`、`node_modules` 等隐藏/大目录

### sanitizer.rs

```rust
pub fn redact_env_value(key: &str, value: &str) -> String { ... }
pub fn redact_path(path: &str, home: &str) -> String { ... }  // 替换 home 为 ~
```

## Domain 类型扩展

在 `domain/` 下新增或扩展的类型：

```rust
// domain/target.rs — 扩展现有 SyncTarget
pub struct RealTargetConfig {
    pub root_path: String,
    pub exists: bool,
    pub config_summary: Option<TargetConfigSummary>,
}

pub struct TargetConfigSummary {
    pub model: Option<String>,
    pub editor_mode: Option<String>,
    pub theme: Option<String>,
    pub mcp_server_count: usize,
    pub skill_count: usize,
    pub hook_count: usize,
    pub permission_allow_count: usize,
    pub permission_deny_count: usize,
    pub plugin_count: usize,
    pub startup_count: u32,
    pub total_sessions: u32,
    pub total_messages: u32,
}

// domain/usage.rs — 扩展
pub struct RealUsageSummary {
    pub total_sessions: u32,
    pub total_messages: u32,
    pub total_cost_usd: f64,
    pub daily_activity: Vec<DailyActivity>,
    pub model_usage: Vec<ModelUsageEntry>,
    pub codex_thread_count: u32,
    pub data_sources: Vec<DataSourceInfo>,
}

// domain/insight.rs — 扩展
pub struct RealInsight {
    pub id: String,
    pub category: InsightCategory,
    pub title: String,
    pub summary: String,
    pub severity: String,
    pub evidence: String,        // 数据依据
    pub source: String,
}

pub enum InsightCategory {
    TokenAnomaly,
    ConfigDrift,
    SkillUsage,
    SessionActivity,
}

// domain/registry.rs — 扩展
pub struct LocalSkillEntry {
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub source: String,         // "claude" | "codex" | "opencode"
    pub path: String,
}
```

## Service 层变更

每个 service 的变更模式一致：保留 fixture 函数作为 fallback/test，新增 `real_*` 函数读取真实数据。

| Service | 变更 |
|---|---|
| `target_integration_service` | 扩展 `discover_real_targets()` → 调用 `claude_reader` + `codex_reader` 获取 config summary |
| `profile_service` | 新增 `build_real_profiles()` → 从 readers 聚合为 Profile 结构 |
| `usage_service` | 新增 `real_usage_summary()` → 从 stats-cache + SQLite 聚合 |
| `insight_service` | 新增 `real_insights()` → 基于真实数据分析生成 |
| `registry_service` | 新增 `local_skill_registry()` → 从 skill_scanner 获取 |
| `sync_governance_service` | 新增 `real_sync_governance()` → 对比两端 MCP/permission 差异 |
| `account_service` | 新增 `real_account_workspace()` → 从 config 聚合 |

## Command 层变更

现有 command 签名不变，内部切换为调用 `real_*` 函数。当 reader 返回 error/empty 时 fallback 到 fixture。

## 前端变更

### types.ts

新增与后端 domain 对应的 TypeScript 类型。使用 camelCase（serde rename_all = "camelCase" 保持一致）。

### api.ts

现有 `call()` 函数不变。TypeScript fixture 数据需要更新以匹配新类型结构，确保浏览器开发模式仍可用。

### 视图变更

| 视图 | 变更 |
|---|---|
| ProfileView | 展示真实的 rule/skill/MCP 数量，标记数据来源 |
| SyncView | 展示真实的 MCP 差异和 permission 差异 |
| UsageView | 展示真实的 token/cost/session 数据 |
| InsightsView | 展示基于真实数据生成的洞察 |
| DiscoverView | 展示本机实际 skill 列表 |
| SettingsView | 展示真实的 model/editor/theme 配置 |
| HomeView | 健康分动态计算 |
| MenuBarPanel | 状态行接入真实数据 |
| OperateView | 保持 fixture（Wake 延后） |

## Rust 依赖新增

```toml
[dependencies]
toml = "0.8"          # 解析 Codex config.toml
rusqlite = { version = "0.31", features = ["bundled"] }  # 读取 Codex SQLite
```

## 错误处理

所有 reader 函数返回 `Result<T, ReaderError>` 或直接返回带 `Option` 的结构体。Service 层捕获 reader error 后 log warning 并 fallback 到 fixture/empty。不对前端暴露 reader error 的内部细节。

## 安全边界

- readers 只 `open()` + `read()`，不 `write()`/`create()`/`delete()`
- SQLite 用 `SQLITE_OPEN_READ_ONLY` flag
- `~/.codex/auth.json`、`~/.codex/.env` 在 reader 中硬编码跳过
- env var 脱敏在 reader 层完成，service/command 拿到的已经是安全数据
