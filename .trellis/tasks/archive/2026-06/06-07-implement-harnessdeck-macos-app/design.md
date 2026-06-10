# HarnessDeck 实现设计

## 范围

将可运行的本地应用作为一个集成的 Tauri 项目实现。目标是一个功能完整的本地优先工作台，覆盖所有实现设计阶段，同时保持安全默认值。

## 架构

```text
React UI
  -> src/lib/api.ts
  -> Tauri commands
  -> Rust services
  -> 领域模型 + fixture 适配器 + 本地清单文件
```

## 前端

- 使用 React + TypeScript + Vite。
- 首次构建在应用状态中管理导航。
- 固定 UI 文案保存在 `zh-CN` 和 `en-US` 的类型化语言字典中。
- 语言和主题偏好存储在前端 localStorage 中；后续按需暴露匹配的 Rust 命令。
- 使用 CSS 变量实现浅色和深色 token。
- 使用紧凑的开发者工作台布局：左侧导航栏、顶部操作区、菜单栏面板和主内容区。
- 使用简洁的工程仪表美学，搭配克制的色彩点缀。

## 后端

- 使用 Tauri 2 commands 作为 IPC 边界。
- `domain/` 拥有可序列化的配置集、目标、部署计划、清单、用量和防护类型。
- `services/` 拥有应用路径创建、fixture 配置集加载、fixture 目标状态、密钥扫描、部署计划生成和清单写入。
- Phase 1 存储仅写入 `~/Library/Application Support/HarnessDeck/` 下的 HarnessDeck 应用数据路径。
- 本任务中任何命令不得读写真实的 Claude Code 或 Codex 配置目录。
- 检查真实本地目标目录的命令必须要求显式的本地读取授权标志，并返回安全摘要。
- 写入真实目标目录的命令必须要求备份 ID、已预览的计划 ID、显式确认令牌、清单写入、验证和回滚元数据。

## 数据模型

- `HarnessProfile`：id、名称、描述、规则、技能、MCP 引用、目标、同步策略、元数据。
- `TargetKind`：Codex、ClaudeCode。
- `DeployPlan`：id、配置集 id、目标类型、操作列表、风险等级、dry-run 标志。
- `DeploymentManifest`：id、创建时间、配置集 id、目标类型、dry_run、操作数量、计划摘要、备份策略。
- `UsageSummary`：费用、token 数、时长、漂移、置信度。
- `GuardPolicy`：fixture 模式、提示词上传、源码上传、真实写入、Keychain 模式、备份模式。
- `AccountWorkspace`：提供商、Base URL、默认模型、预算、限额和 Keychain 引用。
- `RegistryTemplate`：策展的实践模板元数据、来源、质量信号和安全评分。
- `Insight`：本地规则推荐、受影响配置集、来源置信度、严重程度。
- `FeedItem`：官方/社区/注册中心/配置集影响的更新元数据。
- `WakeSession`：标准唤醒、定时唤醒、显示器睡眠控制和实验性合盖唤醒状态。

## 安全

- Fixture 模式默认启用且可见。
- Dry-run 是唯一的部署动作。
- 密钥扫描器阻止可疑的配置集内容。
- 真实写入以禁用的策略状态体现。
- Keychain 仅通过 mock/引用接口体现。
- 安全目标读取集成为 opt-in，返回摘要而非原始配置转储。
- 远程 LLM 和 GitHub 发现操作为 opt-in，仅使用脱敏元数据。

## 测试

- Rust 单元测试验证纯模型和服务行为。
- 前端测试验证可见的工作流和偏好行为。
- 构建验证在测试通过后使用 `pnpm tauri build`。

## 实现设计阶段覆盖

- Phase 0 项目基础：可运行的 Tauri/React/Rust 应用、命令、路径、国际化、主题、菜单栏和工作台入口。
- Phase 1 本地核心循环：示例配置集、fixture 目标、部署计划预览、dry-run 清单、菜单/工作台状态。
- Phase 2 安全目标集成：opt-in 的 Claude Code 和 Codex 发现/读取/验证；写入仍被管控。
- Phase 3 同步治理：三方 diff 模型、冲突队列、漂移检测、回滚预览、备份元数据。
- Phase 4 账户工作区：账户设置、预算、提供商/模型默认值、Keychain 引用接口、审计轨迹。
- Phase 5 用量与费用：官方/本地/估算/缺失置信度标签和本地聚合 fixture。
- Phase 6 注册中心与 find-best-skill：策展的注册中心、本地评分、可选的 GitHub 发现管控。
- Phase 7 洞察与 Feed：本地规则洞察和配置集影响 Feed。
- Phase 8 唤醒控制：标准/定时/显示器睡眠控制和实验性合盖唤醒确认。

## 提交策略

- Commit 1：Trellis + Phase 0 环境/依赖基础。
- Commit 2：实现设计 Phase 0 应用基础和 UI 框架。
- Commit 3：实现设计 Phase 1 本地核心循环。
- Commit 4：实现设计 Phase 2 安全目标集成 + Phase 3 同步治理。
- Commit 5：实现设计 Phase 4 账户工作区 + Phase 5 用量/费用。
- Commit 6：实现设计 Phase 6 注册中心 + Phase 7 洞察/Feed + Phase 8 唤醒控制。
- Commit 7：安全审计、验证和交付文档。

仅本地提交。

## 回滚

由于本任务不涉及真实用户 Agent 配置，回滚方式为普通的 git revert 项目文件，加上按需删除 HarnessDeck 应用数据清单。运行时 dry-run 清单是本地产品数据，不是用户 Agent 配置。
