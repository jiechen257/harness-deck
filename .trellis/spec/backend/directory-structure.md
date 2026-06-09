# 后端目录结构

后端代码位于 `src-tauri/src/`，采用三层 Rust 架构，另外将 tray/窗口管理逻辑从 `lib.rs` 分离。

## 目录布局

```text
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                          # Tauri 入口
    lib.rs                           # 模块声明 + invoke_handler 注册
    tray.rs                          # 系统托盘图标、菜单、点击事件
    window.rs                        # 窗口管理（show_menu_panel、workbench 显示）
    commands/
      mod.rs
      app_commands.rs
      profile_commands.rs
      target_commands.rs
      deploy_commands.rs
      account_commands.rs
      registry_commands.rs
      insight_commands.rs
      usage_commands.rs
      wake_commands.rs
    domain/
      mod.rs
      app.rs
      adapter.rs                     # TargetKind 枚举
      deploy_plan.rs
      errors.rs                      # CommandError 结构体
      manifest.rs
      profile.rs                     # HarnessProfile、ProfileSummary、ValidationReport
      account_workspace.rs
      insights.rs
      registry.rs
      sync_governance.rs
      target_integration.rs
      usage.rs
      wake_control.rs
    services/
      mod.rs
      app_paths.rs
      adapter_service.rs
      privacy_service.rs
      profile_service.rs
      storage_service.rs
      sync_governance_service.rs
      target_integration_service.rs
      account_service.rs
      insight_service.rs
      registry_service.rs
      usage_service.rs
      wake_service.rs
    tests/                           # 按领域组织测试
      mod.rs
      profile_tests.rs              # 配置集解析、验证、秘密扫描
      deploy_tests.rs               # deploy plan 生成、manifest 写入
      target_tests.rs               # 目标发现授权
      sync_governance_tests.rs      # 三方 diff、冲突、漂移
      account_tests.rs              # 账号工作区、Keychain 引用
      usage_tests.rs                # 用量汇总、置信度标签
      registry_tests.rs             # 注册表模板、技能评分
      insight_tests.rs              # 洞察、feed
      wake_tests.rs                 # 防睡模式、实验性 lid-awake
```

## 模块组织

### 三层架构（不变）

- **`domain/`** — 可序列化的数据结构和纯业务规则。无文件系统、Tauri、网络或 UI 依赖。
- **`services/`** — 副作用层：应用数据目录、manifest 文件、fixture 加载，未来的 SQLite 和 Keychain 封装。每个 service 文件对应一个领域区域。
- **`commands/`** — Tauri IPC 边界。command 验证参数、调用 service、返回 `Result<T, CommandError>`。保持薄封装。

### tray/窗口分离（新增）

当前 `lib.rs` 混合了模块声明、tray 图标构建、窗口管理和 handler 注册。拆分为：

- **`lib.rs`** — 仅保留模块声明、`run()` 函数和 `invoke_handler` 注册。
- **`tray.rs`** — tray 图标构建、菜单项定义、tray 事件处理。
- **`window.rs`** — `show_menu_panel`、workbench 窗口显示等窗口管理函数。

### 测试按领域组织（新增）

将 `phase{N}_tests.rs` 重组为按领域域拆分的测试文件，放在 `tests/` 目录下：

| 旧文件 | 新文件 | 覆盖领域 |
|--------|--------|----------|
| `phase1_tests.rs` | `profile_tests.rs` + `deploy_tests.rs` | 配置集验证、秘密扫描、deploy plan、manifest |
| `phase2_3_tests.rs` | `target_tests.rs` + `sync_governance_tests.rs` | 目标发现授权、同步治理 |
| `phase4_5_tests.rs` | `account_tests.rs` + `usage_tests.rs` | 账号工作区、Keychain、用量置信度 |
| `phase6_8_tests.rs` | `registry_tests.rs` + `insight_tests.rs` + `wake_tests.rs` | 注册表、洞察/feed、防睡控制 |

### 添加新 Tauri 命令的流程

```rust
// 1. domain/ — 定义结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WakeSession {
    pub mode: WakeMode,
    pub active: bool,
    pub duration_minutes: Option<u32>,
}

// 2. services/ — 实现逻辑
pub fn get_fixture_wake_control() -> WakeControlSummary { /* ... */ }

// 3. commands/ — 薄 command 处理器
#[tauri::command]
pub fn get_wake_control() -> WakeControlSummary {
    wake_service::get_fixture_wake_control()
}

// 4. lib.rs — 在 generate_handler![] 中注册
.invoke_handler(tauri::generate_handler![
    commands::wake_commands::get_wake_control,
])
```

然后在前端 `src/lib/types.ts` 添加 TypeScript 类型，在 `src/lib/api.ts` 添加 `invoke` 封装。

## 命名约定

- Rust 模块使用 `snake_case`。command 文件命名为 `{domain}_commands.rs`，service 命名为 `{domain}_service.rs`，测试命名为 `{domain}_tests.rs`。
- 公开 domain 类型使用产品名称：`HarnessProfile`、`DeployPlan`、`ManifestSummary`、`TargetKind`、`CommandError`、`SyncGovernance`。
- 代码中保持产品专用英文标识符，中文只出现在前端本地化文案中。

## 边界

- 前端代码不可写入用户 agent 配置文件。
- 当前 fixture 模式下，Rust command 不暴露真实写操作。
- 当前 fixture 模式下，适配器不读取真实 Claude Code 或 Codex 目录。
- 每个新 command 必须在 `lib.rs` 的 `generate_handler![]` 中注册。
