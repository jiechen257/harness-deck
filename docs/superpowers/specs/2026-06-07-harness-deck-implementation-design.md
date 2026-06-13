# HarnessDeck Phase 0 + Phase 1 实现设计

> 历史文档：本文记录 2026-06-07 的 Profile-first 起步实现方案，不再作为当前实现边界。当前产品逻辑以 `docs/product-design/screens/workbench-home.html` 的 Practice Shard 6 视图工作台和当前 Tauri/Rust/SQLite 实现为准。

## 文档目标

这份文档把产品设计收敛成第一轮可执行工程方案。目标是初始化 Tauri + React + Rust 项目，建立本地优先架构边界，跑通从 Harness Profile 到 deploy plan preview 的最小闭环。

产品边界以 `docs/superpowers/specs/2026-06-07-harness-deck-design.md` 为准。本文件只覆盖起步实现，不展开完整 MVP 的所有细节。

## 实现原则

- 本地优先：默认数据留在本机，敏感动作需要用户确认。
- 安全起步：Phase 1 使用 fixture target 和 dry-run manifest，不真实改写 Claude/Codex 配置。
- Rust 持有关键写入：前端只发起意图，文件、数据库和系统集成由 Rust 服务执行。
- 模块边界清晰：每个 core module 提供稳定接口，UI 通过 Tauri commands 调用。
- 测试先覆盖核心数据模型：Profile、adapter、deploy plan、manifest 和 validation 先有单元测试。

## Phase 划分

### Phase 0: Project Foundation

Phase 0 交付一个可启动、可测试、结构清楚的 macOS app 工程。

交付内容：

- 初始化 Tauri 2 + React + TypeScript + Rust 项目。
- 建立前端目录、Rust service 目录、fixture 目录和 docs 目录。
- 配置基础命令：dev、build、lint、typecheck、test。
- 建立 Tauri IPC 命令边界。
- 建立应用数据目录发现逻辑。
- 建立 UI 本地化基础，默认语言为简体中文，并保留英文切换。
- 建立主题系统，默认浅色，并支持浅色和深色切换。
- 增加最小菜单栏入口和工作台窗口入口。
- 增加 CI 本地等价命令文档。

Phase 0 不接入真实 Claude/Codex 配置，不实现 registry、usage、insight、feed 和 wake control 深度能力。

### Phase 1: Local Core Loop

Phase 1 跑通最小本地闭环。

交付内容：

- 创建 sample Harness Profile。
- 解析并校验 Profile。
- 选择 fixture target：Claude Code 或 Codex。
- 生成 deploy plan。
- 在工作台展示 preview。
- 用户确认 dry-run deployment。
- 写入 dry-run manifest。
- 菜单栏展示当前 Profile、target、deploy plan 状态和最近一次 dry-run 时间。
- 菜单栏和工作台所有固定 UI 文案支持中文和英文，默认显示中文。
- UI 默认浅色主题，同时支持深色主题切换。

Phase 1 的完成标准是用户可以启动 app，看到一个 Profile，生成并预览部署计划，执行 dry-run，看到 manifest 记录和 UI 状态变化。

## 后续 Phase 轮廓

后续工作按模块拆分，避免第一轮把所有能力塞进同一批实现。

- Phase 2: Safe Target Integration，接入真实 Claude Code 和 Codex discovery/read/validate，写入仍需 backup、preview 和 confirm。
- Phase 3: Sync Governance，实现 three-way diff、conflict queue、drift detection 和 rollback。
- Phase 4: Account Workspace，实现 Keychain secret references、switch plan 和 audit trail。
- Phase 5: Usage And Cost，实现 official/local/estimated confidence labels。
- Phase 6: Registry And find-best-skill，实现 curated registry、GitHub discovery 和 scoring。
- Phase 7: Insights And Feed，实现本地规则洞察和 profile impact update feed。
- Phase 8: Wake Control，实现标准防睡、定时防睡、显示器睡眠控制和实验性合盖防睡确认流。

## 推荐目录结构

```text
harness-deck/
  src/
    app/
      App.tsx
      routes.tsx
    components/
      menu-bar/
      workbench/
      preview/
    lib/
      api.ts
      types.ts
  src-tauri/
    src/
      main.rs
      commands/
        mod.rs
        profile_commands.rs
        target_commands.rs
        deploy_commands.rs
      services/
        app_paths.rs
        profile_service.rs
        adapter_service.rs
        sync_service.rs
        storage_service.rs
        privacy_service.rs
      domain/
        profile.rs
        adapter.rs
        deploy_plan.rs
        manifest.rs
        errors.rs
      fixtures/
        profiles/
        targets/
      tests/
  docs/
    superpowers/
      specs/
```

目录原则：

- `domain/` 放纯数据结构和业务规则，尽量不碰文件系统。
- `services/` 负责文件系统、SQLite、Keychain、Tauri state 和系统能力。
- `commands/` 只做参数接收、调用 service、转换错误。
- 前端 `lib/api.ts` 统一封装 Tauri invoke，组件不直接拼 command 名称。
- `fixtures/` 保存 Phase 1 的示例 Profile 和 target config。

## 本地化实现边界

Phase 0 + Phase 1 需要先建立轻量 i18n 机制。

要求：

- 默认 locale 是 `zh-CN`。
- 支持切换到 `en-US`。
- locale 偏好保存在本地 app state。
- 所有固定 UI 文案走 translation key。
- Profile 名称、target 名称、文件路径、manifest id 和用户生成内容保持原文。
- 错误类型使用稳定 code，展示文案按 locale 渲染。
- 测试覆盖默认中文、切换英文、刷新后保留语言偏好。

## 主题实现边界

Phase 0 + Phase 1 需要建立浅色/深色主题机制。

要求：

- 默认 theme 是 `light`。
- 支持切换到 `dark`。
- theme 偏好保存在本地 app state。
- 颜色通过 design tokens 管理，组件不直接写业务无关的固定色值。
- 两套主题的信息层级一致，状态色语义一致。
- 测试覆盖默认浅色、切换深色、刷新后保留主题偏好。

## 品牌视觉实现边界

要求：

- 菜单栏面板和工作台使用不同 surface 层级，避免整套 UI 只有一种背景色。
- 图标优先使用现成 icon library，避免手写 SVG 或临时图形。
- 浅色和深色主题共享同一套语义 token，只切换色值。

## Rust 模块边界

### Profile Core

职责：

- 定义 Harness Profile schema。
- 从 YAML 或 JSON 文件读取 Profile。
- 校验必填字段、版本、target applicability、sync policy 和 metadata。
- 返回结构化错误，给 UI 展示。

起步数据结构：

```rust
pub struct HarnessProfile {
    pub id: String,
    pub name: String,
    pub version: String,
    pub applies_to: Vec<TargetKind>,
    pub rules: Vec<RuleEntry>,
    pub skills: Vec<SkillRef>,
    pub mcp_servers: Vec<McpServerRef>,
    pub sync_policy: SyncPolicy,
    pub metadata: ProfileMetadata,
}
```

Phase 1 支持 sample profile 文件读取和内置 fixture profile 读取。用户自定义 Profile 编辑器放到后续阶段。

### Adapter Core

职责：

- 定义 target adapter trait。
- 提供 Claude Code fixture adapter 和 Codex fixture adapter。
- 生成 target state snapshot。
- 生成 deploy plan input。
- 执行 dry-run verify。

起步 trait：

```rust
pub trait AgentAdapter {
    fn kind(&self) -> TargetKind;
    fn discover(&self) -> Result<TargetDiscovery, AppError>;
    fn read_state(&self) -> Result<TargetState, AppError>;
    fn plan_deploy(&self, profile: &HarnessProfile) -> Result<DeployPlan, AppError>;
    fn verify_dry_run(&self, plan: &DeployPlan) -> Result<VerifyReport, AppError>;
}
```

真实文件写入接口先保留类型位置，Phase 1 不暴露真实执行命令。

### Sync Core

职责：

- 定义 deploy plan、file operation、preview diff 和 manifest。
- 支持 dry-run deployment。
- 写入 manifest record。
- 为后续 three-way diff、backup、rollback 留接口。

关键流程：

```text
profile -> adapter target state -> deploy plan -> preview -> confirm dry-run -> manifest
```

Phase 1 的 manifest 记录计划摘要、target kind、profile id、operation count、created_at 和 dry_run 标记。

### Storage Core

职责：

- 发现应用数据目录。
- 创建 `profiles/`、`manifests/`、`backups/`、`registry-cache/` 和 `feed-cache/`。
- 初始化 SQLite 数据库。
- 存储 manifest index 和 app state。

默认路径：

```text
~/Library/Application Support/HarnessDeck/
  harness-deck.db
  profiles/
  manifests/
  backups/
  registry-cache/
  feed-cache/
```

Phase 1 可以先用 JSON manifest 文件加 SQLite index。若实现成本需要压缩，manifest index 可先放 SQLite，完整 manifest 放文件。

### Privacy Core

职责：

- 提供 secret scanner。
- 提供敏感动作确认模型。
- 为后续 Keychain wrapper 预留接口。

Phase 1 扫描 Profile 和 fixture target 中常见 secret pattern，比如 API key、token、Bearer、private key block。发现疑似 secret 时，阻止导入并在 UI 给出文件和字段位置。

## Tauri Commands

Phase 0 命令：

- `get_app_status() -> AppStatus`
- `get_app_paths() -> AppPaths`
- `get_locale() -> Locale`
- `set_locale(locale) -> Locale`
- `get_theme() -> Theme`
- `set_theme(theme) -> Theme`
- `open_workbench() -> CommandResult`

Phase 1 命令：

- `list_profiles() -> Vec<ProfileSummary>`
- `get_profile(profile_id) -> HarnessProfile`
- `validate_profile(profile_id) -> ValidationReport`
- `list_targets() -> Vec<TargetSummary>`
- `generate_deploy_plan(profile_id, target_kind) -> DeployPlan`
- `confirm_dry_run_deploy(plan_id) -> ManifestSummary`
- `get_latest_manifest() -> Option<ManifestSummary>`

命令约束：

- command 参数必须是明确的 typed payload。
- command 返回统一错误格式。
- 前端不接收 raw Rust error string。
- 真实写入类命令在 Phase 1 不开放。

## 前端实现边界

### Menu Bar Panel

Phase 1 展示：

- app ready 状态
- 当前 Profile
- 当前 target
- 最近 deploy plan 状态
- 最近 dry-run manifest 时间
- 打开 workbench
- refresh
- quit

防睡、usage、account、feed 先显示空状态或 disabled 状态，文案说明当前阶段尚未接入。

### Workbench

Phase 1 路由：

- `Profiles`：Profile 列表、详情、validation report。
- `Sync`：target 选择、deploy plan preview、dry-run confirm、manifest result。
- `Settings`：app paths、privacy defaults、fixture mode 状态。

Discover、Accounts、Insights、Feed 和 Wake Control 可以在导航中保留入口，页面显示 phase roadmap。

### Preview UI

Deploy plan preview 至少展示：

- target kind
- affected files
- operation type
- reason
- before/after 摘要
- risk level
- dry-run 标记

Phase 1 的 preview 只展示 fixture diff，不展示真实用户配置内容。

## 数据模型起步版本

### TargetKind

```text
ClaudeCode
Codex
```

### OperationType

```text
CreateFile
UpdateFile
AppendBlock
ReplaceBlock
Noop
```

### RiskLevel

```text
Low
Medium
High
Blocked
```

Phase 1 的 high 和 blocked 需要阻止 dry-run confirm，并给出原因。

### DataConfidence

```text
Official
LocalLog
Estimated
Missing
```

Phase 1 只在类型中保留，usage UI 使用 `Missing`。

## 错误处理

错误类型：

- `ValidationError`：Profile schema、字段或 policy 不符合要求。
- `SecretDetected`：文件中出现疑似 secret。
- `TargetUnavailable`：fixture 或后续真实 target 发现失败。
- `PlanBlocked`：deploy plan 有 blocked operation。
- `StorageError`：应用数据目录、manifest 或 SQLite 操作失败。
- `IpcError`：命令参数或返回值无法序列化。

UI 展示原则：

- 给出用户能处理的下一步。
- 展示出错对象，比如 profile id、target kind、file path 或 operation id。
- 不展示完整 secret、完整 prompt、完整 log。
- 同一批错误按 source 分组，避免一屏重复报错。

## 安全边界

Phase 1 的硬约束：

- 不读取真实 Claude/Codex 配置目录。
- 不写入真实 Claude/Codex 配置文件。
- 不安装 shell hooks。
- 不调用远端 LLM。
- 不采集 prompts、source code、完整 logs。
- 不把 secrets 写入 SQLite 或 Profile files。

后续 phase 接入真实 target 时，必须先实现 backup、atomic write、verify、manifest 和 rollback。

## 测试策略

### Rust Unit Tests

覆盖：

- Profile 解析成功。
- Profile 缺字段时报 validation error。
- secret scanner 命中疑似 key。
- fixture adapter 生成 target state。
- deploy plan builder 生成预期 operations。
- blocked operation 阻止 confirm。
- manifest summary 写入和读取。

### Frontend Tests

覆盖：

- Profile 列表和详情渲染。
- validation report 渲染。
- target selector 状态。
- deploy plan preview 渲染。
- dry-run result 渲染。
- disabled roadmap 页面渲染。
- 默认中文渲染。
- 英文切换后渲染。
- 刷新后语言偏好保留。
- 默认浅色渲染。
- 深色切换后渲染。
- 刷新后主题偏好保留。

### Manual Verification

手动验证：

- app 能启动。
- menu bar panel 能打开。
- workbench 能打开。
- profile 列表能加载。
- deploy plan 能生成。
- dry-run confirm 能写入 manifest。
- refresh 后仍能看到最新 manifest。

## 验收标准

Phase 0 验收：

- 本地开发命令能启动 app。
- Rust tests 能运行。
- TypeScript typecheck 能运行。
- lint 命令能运行。
- app 数据目录能创建。
- 菜单栏入口和 workbench 入口可见。
- 默认中文 UI 可见，并支持英文切换。
- 默认浅色 UI 可见，并支持深色切换。

Phase 1 验收：

- 至少存在一个 sample Harness Profile。
- Profile validation 有成功和失败 fixture。
- Claude Code 和 Codex fixture target 都能生成 deploy plan。
- Deploy plan preview 能显示 operation list。
- dry-run confirm 能生成 manifest。
- 菜单栏和 workbench 能展示最新 manifest 状态。
- 安全检查能阻止带疑似 secret 的 Profile。
- UI 固定文案支持中文和英文，默认中文。
- UI 支持浅色和深色主题，默认浅色。

## 实施顺序

推荐顺序：

1. 初始化 Tauri + React + Rust 工程。
2. 建立 lint、typecheck、test 命令。
3. 建立 Rust domain types 和 error model。
4. 建立 app paths 和 storage init。
5. 增加 sample Profile fixtures。
6. 实现 Profile parser 和 validator。
7. 实现 fixture adapters。
8. 实现 deploy plan builder。
9. 实现 dry-run manifest 写入。
10. 暴露 Tauri commands。
11. 实现前端 workbench 基础页面。
12. 实现菜单栏状态面板。
13. 补齐测试和手动验证文档。

## 主要风险

- Tauri menu bar 行为在 macOS 上依赖窗口和 tray API 细节，Phase 0 需要尽早验证。
- 真实 Claude/Codex 配置格式可能变化，Phase 1 使用 fixture，Phase 2 需要把 schema validation 独立出来。
- Profile schema 过早设计太复杂会拖慢第一轮实现，Phase 1 只保留 rules、skills、MCP refs、sync policy 和 metadata 的必要字段。
- SQLite 与 JSON manifest 双写容易不一致，Phase 1 需要把 manifest file 作为完整记录，SQLite 只做 index。
- 前端页面过早追求完整工作台会稀释核心闭环，Phase 1 保留 roadmap 页面即可。

## 不进入 Phase 1 的内容

以下内容在后续 phase 处理：

- 真实 Claude/Codex 配置写入。
- three-way diff 和 conflict queue。
- rollback 执行。
- Account Workspace 和 Keychain 写入。
- usage/billing 聚合。
- GitHub discovery 和 registry scoring。
- 本地 LLM 或远端 LLM 洞察。
- 官方和社区 feed。
- wake control 系统能力。
- 自动 hooks。

## 下一步

用户 review 本实现设计后，进入 implementation plan。计划应按 Phase 0 和 Phase 1 拆成可执行任务，每个任务包含目标、涉及文件、测试命令和验收方式。
