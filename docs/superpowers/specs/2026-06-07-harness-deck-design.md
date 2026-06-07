# HarnessDeck 产品设计

## 产品名称

推荐产品名：**HarnessDeck**。

`HarnessDeck` 的定位是 harness engineering 的控制台。它保留了早期 `awake-dock` 方案里的菜单栏控制中心感觉，同时把产品范围扩展到最佳实践发现、Profile 管理、Claude/Codex 同步、日常操作和持续优化。

备选名称：

- `AgentDeck`：覆盖面更宽，适合未来扩展到更泛的 agent workflow 管理。
- `HarnessPilot`：强调引导、建议和优化。
- `AgentForge`：强调构建和塑造 agent 工作流。

当前采用 `HarnessDeck` 作为产品名，`harness-deck` 作为 package 与 repository slug。`Awake Dock` 只作为早期内部代号保留在历史上下文里。

## 核心产品判断

HarnessDeck 是一个 macOS 菜单栏应用和管理工作台，目标是帮助用户把 harness engineering 用稳、用深、用久。

产品覆盖完整生命周期：

1. 发现社区里的 harness engineering 最佳实践。
2. 把这些实践转成可落地的本地 Harness Profile。
3. 在 Codex 和 Claude 之间同步 Profile。
4. 通过菜单栏控制中心把 Profile 融入日常工作。
5. 观察使用模式，持续给出优化建议。

MVP 是一个本地完整闭环，并预留可插拔远端集成。它的主类目是 harness lifecycle control center，防睡控制和配置管理是支撑能力。

## 产品模型

核心对象是 `Harness Profile`，中文可理解为一组可复用的 harness engineering 实践包。

一个 Harness Profile 可以包含：

- rules
- skills
- MCP servers
- sync policies
- account strategy
- provider 和 model 默认值
- budget constraints
- task applicability
- source metadata
- version history
- usage and improvement signals

产品使用三层层级：

```text
Community Template -> Project Harness Profile -> Agent Deployment Target
```

### Community Template

社区或官方精选的最佳实践模板，面向某类任务，比如前端实现、bug 排查、研究笔记、macOS app 开发。

### Project Harness Profile

面向本地项目的 Profile，可以来自社区模板，也可以由用户创建。它是用户主要编辑和维护的对象。

### Agent Deployment Target

真实部署目标，比如 Claude Code 或 Codex。每个 target adapter 负责读取、校验、写入和恢复对应工具的配置。

### Account Workspace

安全的账号上下文，包含 provider、base URL、默认 model、预算、限制和 Keychain secret reference。

### Deployment Manifest

Profile 部署到 target 后留下的记录。它保存目标文件、资源 hash、同步策略、备份快照和 rollback 元数据。

### Usage Insight

本地分析产物，来源包括 token 用量、session、文件变化、Profile 使用情况、drift、错误和更新信息。

## MVP 产品形态

选定形态是：**菜单栏控制中心优先，配套完整工作台**。

菜单栏面板是日常入口，展示运行状态并提供快速操作。完整工作台承载发现、Profile 编辑、同步治理、账号管理、洞察和设置。

## 本地化与语言

HarnessDeck UI 必须支持简体中文和英文，默认显示简体中文。用户可以在 Settings 中切换界面语言，语言偏好保存在本地。

语言要求：

- 菜单栏面板、工作台导航、状态标签、错误提示、确认弹窗和空状态都需要纳入本地化。
- 产品专有名词可以保留英文，比如 Harness Profile、Account Workspace、Deployment Manifest、dry-run、rollback、fixture。
- 用户生成内容、Profile 名称、target 名称和文件路径不自动翻译。
- README 和外部说明保持中文优先，并提供英文版本。

## 主题与外观

HarnessDeck 默认使用浅色主题，并支持浅色和深色主题切换。主题偏好保存在本地。

主题要求：

- 默认打开应用时使用浅色主题。
- 浅色主题需要保持高密度开发者工具感，界面以白色、浅灰和清晰分隔线为主。
- 深色主题用于夜间或高专注场景，保持与浅色主题相同的信息层级和交互结构。
- 状态颜色在两套主题中保持一致语义：绿色表示通过，琥珀色表示需要 review，红色表示阻塞或风险，蓝色表示主要动作。
- 主题切换入口放在 Settings，并可在原型阶段放在顶栏便于验证。

## 品牌视觉系统

HarnessDeck 的品牌视觉采用 **北斗导航 + 司南工程仪表**。北斗负责表达生命周期导航，司南负责表达校准、方向和控制台工具感。

视觉要求：

- 使用北斗七星作为生命周期象征，七个节点分别对应 Discover、Profile、Sync、Operate、Usage、Insight、Guard。
- 主色使用北辰蓝，表示当前阶段、主要动作和导航焦点。
- 通过玉衡青、丹朱金、赤霞红、天青紫等状态色建立模块差异，避免整套 UI 只有一种颜色。
- 菜单栏面板和主窗口使用不同层次。菜单栏更像压缩仪表，主窗口更像完整工作台。
- 文化符号保持克制，优先以导航节点、图标、状态标记和微型星图表达，不做大面积插画。
- 山海经元素可作为后续 badges、Profile archetype 或 registry 分类扩展，MVP 主视觉以北斗和司南为主。

## 信息架构

### 菜单栏面板

菜单栏面板展示：

- 防睡状态：标准防睡、定时防睡、显示器睡眠、实验性合盖防睡
- 系统状态：电量、CPU、内存、运行时长
- Claude 和 Codex 用量：今日、本周、本月、5 小时 burn rate、成本、数据可信度
- 当前 Harness Profile：项目、任务类型、部署状态
- 账号状态：当前 Account Workspace 和预算状态
- 同步状态：drift、冲突、最近一次部署
- 与当前 Profile 相关的高优先级更新
- 快速操作：切换 Profile、切换账号、同步、打开工作台、刷新、退出

### 工作台分区

二级工作台按生命周期组织：

- `Discover`：find-best-skill、精选 registry、GitHub 发现、官方和社区更新 feed
- `Profiles`：templates、project profiles、rules、skills、MCP、sync policies、version history
- `Sync`：Claude/Codex targets、deploy plan、three-way diff、conflict queue、drift detection、rollback
- `Accounts`：Account Workspace、Keychain refs、switch plan、provider/model settings、budgets
- `Insights`：token 异常、重复失败、Profile 优化建议、更新影响
- `Settings`：privacy、hooks、data sources、remote connectors、launch at login、backups

## 技术栈

采用：

- Tauri 2
- React
- TypeScript
- Rust
- SQLite
- macOS Keychain

React 渲染菜单栏 UI 和工作台 UI。Rust 负责系统集成、文件访问、Profile 操作、用量聚合、账号切换、registry 访问和分析逻辑。Tauri IPC 暴露稳定命令，关键本地配置文件只允许 Rust 服务写入。

## 后端服务

### PowerService

处理标准 macOS wake assertions、定时防睡、显示器睡眠控制和实验性合盖防睡路径。它需要报告当前 assertion 状态，并支持一键恢复默认电源设置。

### ProfileService

管理 Profile 文件、template 派生、版本、Profile 校验、Profile diff 和 Profile metadata。

### AgentAdapterService

为 Claude Code 和 Codex 提供统一 adapter interface。每个 adapter 负责发现、读取、schema 校验、deploy plan 生成、写入、验证、reload guidance 和 rollback。

MVP 深度支持 Claude Code 和 Codex。adapter 层保留扩展空间，后续可接入 Claude Desktop、Gemini CLI、OpenCode 和其他 agent tools。

### SyncService

执行 sync policies 和 deployment plans。它处理 three-way diff、conflict queue、drift detection、atomic writes、backup snapshots、verification、manifest writing 和 rollback。

### AccountService

管理 Account Workspaces。API keys 和 provider tokens 存在 Keychain，SQLite 和 Profile 文件只保存 secret references。

### UsageService

优先聚合官方 usage/billing 数据；当官方数据缺失时，读取可用的本地日志；精确用量不可得时才使用估算。每个指标都带有 source 与 confidence label。

### RegistryService

读取精选 registry，并可选择通过 GitHub search 扩展发现范围。它为 `find-best-skill` 提供评分，评分维度包括任务匹配、质量、社区信号、个人反馈和安全风险。

### InsightService

默认运行本地规则分析。用户可以选择启用本地 LLM。远端 LLM 只接收用户确认过的脱敏摘要。

### FeedService

聚合官方 changelog、社区更新、registry 变化和 Profile impact alerts。

### AuditService

记录账号切换、部署、rollback、隐私授权和配置写入。

## 存储模型

存储采用混合模型：

- SQLite 存 indexes、state、deployment history、usage aggregation、feed cache、insights 和 audit trail。
- Profile files 存 human-readable rules、skills、MCP references、sync policies 和 Profile metadata。
- Keychain 存 API keys、provider tokens 和其他 secrets。
- backup directory 在写入前保存目标配置快照。
- deployment manifests 记录 target deployment state，并用于 drift detection。

推荐默认路径：

```text
~/Library/Application Support/HarnessDeck/
  harness-deck.db
  profiles/
  manifests/
  backups/
  registry-cache/
  feed-cache/
```

当用户希望用 Git 管理项目级 Profile 时，Profile 可以复制或链接到对应 repository。

## 核心数据流

```text
Discover template or skill
  -> install into Project Harness Profile
  -> generate Deploy Plan
  -> preview changes and resolve conflicts
  -> deploy through Claude/Codex adapters
  -> verify writes and record manifest
  -> observe usage and drift
  -> produce insights
  -> accept insight as a new profile version
```

## 同步策略

同步由策略处理常规场景，由 three-way diff 处理冲突。

策略示例：

- rules：append、replace、scoped merge
- skills：link、copy、replace、ignore
- MCP：merge、replace、target-specific override
- accounts：按 target 隔离或绑定到 Profile
- model defaults：target-specific 或 shared
- budgets：account-bound 或 profile-bound

Three-way diff 使用：

- base manifest
- current target state
- desired profile state

冲突动作：

- accept profile
- keep target
- merge
- ignore once
- create new profile version from target

## 账号切换

MVP 使用安全优先的 Account Workspaces。

每个 workspace 包含：

- provider
- base URL
- default model
- budget
- rate 或 spend limits
- intended use
- Keychain secret reference
- target deployment rules

切换前先生成 Switch Plan。Plan 需要列出文件、环境变量、目标设置、预期 reload 要求和 rollback 点。

## 用量与成本

用量指标按以下维度展示：

- 今日
- 本周
- 本月
- 5 小时窗口
- agent
- Profile
- account
- source confidence

数据来源：

- 可用时使用官方 usage/billing APIs
- 可用时使用本地 Claude/Codex logs 和 usage files
- 精确用量不可得时使用估算

UI 必须标注每个指标的数据类型：official、local log、estimated 或 missing。

## 发现与 find-best-skill

MVP 使用混合发现源：

- 精选 registry 作为可信默认来源
- GitHub search 作为扩展发现来源

`find-best-skill` 排名使用：

- task match
- current project stack
- target agent
- existing profile context
- documentation quality
- permissions and safety
- maintenance status
- community signal
- personal usage feedback

这个功能需要回答：这个项目、这个任务、这些 agents，当前最适合用哪个 skill。

## 洞察

分析分层执行：

1. 默认本地规则引擎。
2. 可选本地 LLM，用于 session 摘要和建议生成。
3. 可选远端 LLM，输入限定为用户确认过的脱敏摘要。

洞察类型：

- token spike
- high burn rate
- long session with low file-change output
- repeated conflict
- missing skill for recurring task
- rules drift
- MCP mismatch
- account budget risk
- profile update opportunity
- official update that affects active profile

## 每日更新

每日更新是分层 feed：

- official：Codex、Claude Code、Claude Desktop、OpenAI/Anthropic APIs、相关 SDK 和 CLI
- community：GitHub repositories、skill registry、MCP servers、workflow/rules templates
- profile impact：影响当前 active profiles 的高优先级事项

菜单栏只展示高优先级且与 Profile 相关的更新。工作台展示完整 feed。

## 防睡控制

MVP 防睡控制采用安全优先模型：

- 标准防睡作为可靠默认模式
- 定时防睡：forever、1h、2h、4h
- 显示器睡眠控制作为独立设置
- 实验性合盖防睡需要明确风险确认
- 展示当前 assertion state 和剩余时间
- 一键恢复默认电源设置

实验性合盖防睡必须清楚说明权限、硬件、电源和散热约束。

## 隐私与安全

硬性隐私规则：

- 默认不上传 prompts
- 默认不上传 source code
- 默认不上传完整 logs
- Profile files 不保存 secrets
- SQLite 不保存 API keys
- 不自动安装 shell 或 CLI hooks

敏感动作需要明确授权：

- 读取 logs 和 sessions
- 启用 hooks
- 用本地 LLM 处理 session 内容
- 向远端 LLM 发送脱敏摘要
- 启用实验性合盖防睡

导入或同步 Profile 文件前，需要扫描疑似 secrets。

## 错误处理

关键文件写入遵循：

```text
plan -> preview -> backup -> atomic write -> verify -> manifest
```

失败行为：

- write failure 保持原始 config 不变
- verification failure 触发 rollback
- schema mismatch 阻止 deployment
- permission error 展示具体 target 和所需权限
- overwrite 前先报告 drift
- 每个 deployment batch 都支持 rollback

## MVP 范围

MVP 包含：

- 菜单栏控制中心
- 二级工作台
- 标准防睡和定时防睡
- 显示器睡眠控制
- 实验性合盖防睡
- Claude/Codex 用量和成本视图
- 数据可信度标签
- Harness Profiles
- 精选 registry 和 GitHub 发现
- find-best-skill
- Claude Code 和 Codex adapters
- policy sync 和 three-way diff
- account workspace 和安全切换
- Keychain secret storage
- deploy plan、backup、manifest、rollback
- 本地规则洞察
- profile impact update feed
- privacy controls

## MVP 暂不包含

MVP 暂不包含：

- team approval workflows
- cloud secret hosting
- 默认 full-session upload
- 自动 shell 或 CLI takeover
- 对所有 agent tool 的深度支持
- 在所有 Mac 上保证合盖防睡行为一致
- provider APIs 不可用时的完整官方 billing 覆盖

## 测试策略

### Rust Unit Tests

- profile parser
- profile validator
- sync policy
- three-way diff
- secret scanner
- usage aggregation
- registry scoring
- insight rules

### Adapter Fixture Tests

- Claude Code config read/write
- Codex config read/write
- missing file
- invalid schema
- permission denied
- target drift

### Integration Tests

- deploy plan generation
- atomic write
- backup creation
- rollback
- manifest update
- drift detection
- account switch plan

### UI Tests

- menu bar state rendering
- usage confidence labels
- conflict queue
- account switch preview
- registry search results
- profile impact feed

### Manual macOS Verification

- standard awake
- timed awake
- display sleep behavior
- launch at login
- Keychain read/write
- permission dialogs
- experimental lid-awake warning flow
- rollback from failed target write

## 关键设计决策

HarnessDeck 按本地优先的 harness lifecycle 产品来构建。日常入口是菜单栏，核心价值来自发现、创建 Profile、安全同步、运行可见性和持续优化这一条闭环。
