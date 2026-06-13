# 后端目录结构

后端代码位于 `src-tauri/src/`，采用 domain / services / commands / db / readers 分层。当前 `lib.rs` 持有 tray、窗口和 handler 注册逻辑。

## 目录布局

```text
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                          # Tauri 入口
    lib.rs                           # 模块声明、tray/window 管理、invoke_handler 注册
    commands/
      mod.rs
      app_commands.rs
      db_commands.rs
      intake_commands.rs
      loop_commands.rs
      projection_commands.rs
      skill_commands.rs
      byoa_commands.rs               # 服务文件存在；当前未在 lib.rs 注册
    db/
      mod.rs
      schema.rs
      asset_repo.rs
      audit_repo.rs
      auth_repo.rs
      ops_repo.rs
      practice_repo.rs
      projection_repo.rs
      refresh_repo.rs
      registry_repo.rs
      signal_repo.rs
      skill_config_repo.rs
      source_config_repo.rs
    domain/
      mod.rs
      app.rs
      audit.rs
      auth_state.rs
      byoa.rs
      errors.rs
      insights.rs
      local_asset.rs
      loop_summary.rs
      ops_script.rs
      practice.rs
      projection.rs
      projection_plan.rs
      refresh.rs
      registry.rs
      registry_connection.rs
      signal.rs
      source_config.rs
      system_skill.rs
      usage.rs
    services/
      mod.rs
      app_paths.rs
      byoa_service.rs
      insight_service.rs
      intake_service.rs
      loop_service.rs
      projection_service.rs
      secret_service.rs
      skill_service.rs
      target_adapter.rs
      usage_service.rs
      wake_service.rs
    readers/
      claude_reader.rs
      codex_reader.rs
      sanitizer.rs
      skill_scanner.rs
    db_tests.rs
    intake_tests.rs
    loop_tests.rs
    projection_tests.rs
    skill_tests.rs
```

## 模块组织

- `domain/`：可序列化的数据结构和纯业务规则。无文件系统、Tauri、网络或 UI 依赖。
- `db/`：SQLite 连接、schema 初始化、seed、repository。repository 返回 domain 类型或简单持久化结构，不直接暴露 SQL 到 commands。
- `services/`：副作用层。负责应用数据目录、registry、projection、target adapter、secret boundary、intake 和 skill 扫描。
- `commands/`：Tauri IPC 边界。command 验证参数、检查授权、调用 service、返回 `Result<T, CommandError>`。保持薄封装。
- `readers/`：读取 Claude/Codex 本地信息、skill 扫描和脱敏。reader 输出必须经过 sanitizer 或 domain 边界后再进入 service。

## macOS 菜单栏图标约定

Dock / app bundle icon 和菜单栏 tray icon 使用不同资源：

- Dock / app bundle icon 由 `src-tauri/icons/icon-master.svg` 生成，并通过 `src-tauri/tauri.conf.json` 的 `bundle.icon` 引用。
- 菜单栏 tray icon 使用透明单色模板图 `src-tauri/icons/tray-template.png`，Rust 侧通过 `tauri::include_image!("icons/tray-template.png")` 嵌入，并在 `TrayIconBuilder` 上同时设置 `.icon(...)` 和 `.icon_as_template(true)`。
- 不要用 `app.default_window_icon()` 作为菜单栏图标。

## 测试按领域组织

| 文件 | 覆盖领域 |
|------|----------|
| `db_tests.rs` | SQLite schema、seed、repository |
| `intake_tests.rs` | signal source、refresh、normalize |
| `loop_tests.rs` | Practice Card、local asset、loop summary |
| `projection_tests.rs` | target adapter、preview、confirm、adopt、rollback、health |
| `skill_tests.rs` | system skill 扫描和执行边界 |

## 添加新 Tauri 命令的流程

```rust
// 1. domain/ — 定义结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionPlan {
    pub id: String,
    pub target_id: String,
    pub operations: Vec<ProjectionOperation>,
}

// 2. services/ — 实现逻辑
pub fn preview_projection(/* ... */) -> Result<ProjectionPlan, CommandError> { /* ... */ }

// 3. commands/ — 薄 command 处理器
#[tauri::command]
pub fn preview_projection(/* ... */) -> Result<ProjectionPlan, CommandError> {
    projection_service::preview_projection(/* ... */)
}

// 4. lib.rs — 在 generate_handler![] 中注册
.invoke_handler(tauri::generate_handler![
    commands::projection_commands::preview_projection,
])
```

然后在前端 `src/lib/types.ts` 添加 TypeScript 类型，在 `src/lib/api.ts` 添加 `invoke` 封装。

## 命名约定

- Rust 模块使用 `snake_case`。command 文件命名为 `{domain}_commands.rs`，service 命名为 `{domain}_service.rs`，测试命名为 `{domain}_tests.rs`。
- 公开 domain 类型使用当前产品名称：`PracticeCard`、`LocalAsset`、`ProjectionPlan`、`ProjectionTarget`、`AuditEvent`、`CommandError`。
- 代码中保持产品专用英文标识符，中文只出现在前端本地化文案中。

## 边界

- 前端代码不可写入用户 agent 配置文件。
- 真实 projection 写入必须经过 preview、authorization、confirm、audit。
- 适配器读取和写入 Claude Code / Codex target 时必须走 `target_adapter` / `projection_service`。
- 每个新 command 必须在 `lib.rs` 的 `generate_handler![]` 中注册，否则前端不能声明该能力可用。
