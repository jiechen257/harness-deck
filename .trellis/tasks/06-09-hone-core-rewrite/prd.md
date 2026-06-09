# Hone 核心重写：产品方向转型与实施路径

## 背景

HarnessDeck 原始定位为"harness 配置集管理工作台"，核心流程是 Discover → Profile → Sync → Operate → Improve。经过 2026-06-09 的产品方向 grill-me session（19 个决策分支全部收敛），确定以下转型：

- 产品更名：HarnessDeck → **Hone**
- 核心价值：从"配置管理"转向"发现、应用、持续优化 AI coding 范式"
- Tagline：Discover, apply, and hone your AI coding practices.

## 决策全览

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 反馈闭环 | Insight → agent 生成建议 → 用户确认 → 写回配置 |
| 2 | 建议生成方式 | LLM 生成（非硬编码映射） |
| 3 | LLM 调用方式 | BYOA——调用用户本地 agent，不直连 API，不绑定 provider |
| 4 | 执行形态 | CLI 子进程（`spawn("claude", [...])` 或 `spawn("codex", [...])`)  |
| 5 | 范式粒度 | 仓库级（framework / collection / methodology），非配置文件级 |
| 6 | 信息源 | GitHub trending + HN + Reddit + linux.do + 手工策展 |
| 7 | 爬取触发 | 用户手动触发，每日一次，客户端本地执行 |
| 8 | 语义过滤 | 关键词粗筛 + agent 精排（一次 agent 调用） |
| 9 | "应用"模型 | 一键安装为主路径，持续同步降为高级功能 |
| 10 | 视图精简 | 9 → 5（Home / Discover / Usage / Insights / Settings） |
| 11 | 目标用户 | 个人重度 AI coding 用户 |
| 12 | 分发方式 | 完全开源，GitHub 仓库 |
| 13 | Target 工具 | MVP: Claude Code + Codex，架构 adapter pattern 可扩展 |
| 14 | 代码策略 | 核心重写，保留 Tauri 骨架 |
| 15 | MenuBar | 每日一瞥：热点 + 待处理建议数 + 成本 + 快捷操作 |
| 16 | 产品名 | Hone |
| 17 | 路线图 | 4 Phase（见下文） |
| 18 | 平台 | macOS only |
| 19 | 策展内容 | 独立仓库 hone-registry，YAML 格式，社区可 PR |

## 核心链路

```text
Discover（聚合热榜 + 仓库 + 社区讨论）
    → 一键安装（轻量应用到本地 ~/.claude/ 或 ~/.codex/）
    → Usage / Insights（观测效果）
    → Agent 生成优化建议 → 用户确认 → 写回配置（闭环）
         ↑                                            │
         └────────────────────────────────────────────┘
```

## 保留的基础设施

以下已有代码 **不重写**，直接复用：

- Tauri 双窗口架构（main 1180×760 + menubar 356×640）
- 托盘图标构建和面板定位（`tray.rs`、`window.rs`）
- `App.tsx` 的窗口判断逻辑（`panel=1` → MenuBarPanel）
- 主题系统（`useTheme` + `[data-theme="dark"]` CSS）
- 国际化系统（`useLocale` + `copy.ts` 双语字典）
- macOS 原生体验适配（系统字体、光标、右键菜单抑制、⌘ 快捷键）
- 构建工具链（Vite + Tauri CLI + Cargo）
- 测试基础设施（Vitest + jsdom + cargo test）
- `MacChrome` 组件

## 重写范围

### 前端

| 模块 | 变化 |
|------|------|
| `constants/navigation.ts` | 9 视图 → 5 视图，重新定义导航分组 |
| `constants/types.ts` | ViewId 缩减，去掉 discover/profiles/sync/operate/guard 的旧定义 |
| `lib/types.ts` | Domain 模型重写（见下文新模型） |
| `lib/api.ts` | 重写 API 层，接入 BYOA 管道和爬取管道 |
| `components/views/` | 5 个新视图替代 9 个旧视图 |
| `components/menubar/MenuBarPanel.tsx` | 内容重做（热点 + 建议数 + 成本 + 快捷操作） |
| `constants/copy.ts` | 更新文案，匹配新功能 |

### 后端 (Rust)

| 模块 | 变化 |
|------|------|
| `domain/` | 新增爬取结果、安装记录、BYOA 调用、建议等结构体 |
| `services/` | 新增 crawl_service、install_service、byoa_service；保留 usage_service（已有真实数据读取） |
| `commands/` | 匹配新 service 注册新 command |

### 新 Domain 模型（概要）

```rust
// 爬取相关
CrawlSource { GitHub | HackerNews | Reddit | LinuxDo | CuratedRegistry }
CrawlResult { source, items: Vec<CrawlItem>, crawled_at }
CrawlItem { title, url, source, relevance_score, summary, item_type }
ItemType { Repository | Discussion | Article }

// 安装相关
InstallTarget { ClaudeCode | Codex }  // 未来可扩展
InstallAction { CopySkill | AppendRule | AddMcpServer | InstallHook }
InstallRecord { action, target, path, installed_at, source_url }

// BYOA 管道
AgentKind { Claude | Codex }
AgentInvocation { agent, prompt, output_format: Json, timeout }
AgentResult { raw_output, parsed: serde_json::Value, duration_ms }

// Insights 闭环
OptimizationSuggestion { insight_id, description, proposed_change, confidence }
ProposedChange { target, action: InstallAction, preview }
SuggestionStatus { Pending | Accepted | Dismissed }

// 策展
CuratedEntry { url, paradigm_type, description, reason, added_by, added_at }
ParadigmType { Framework | Collection | Methodology | Tool }
```

## 实施路线图

### Phase 1: 地基

**目标**：新骨架可运行，BYOA 管道可调用，真实用量数据可展示。

| 子任务 | 内容 | 依赖 |
|--------|------|------|
| **1.1 BYOA 管道** | Rust 侧实现 agent CLI 检测（`which claude`/`which codex`）、子进程调用、JSON 输出解析、超时和错误处理 | 无 |
| **1.2 导航重构** | 前端 9 → 5 视图，更新 navigation.ts、types.ts、App.tsx 路由，创建 5 个空视图骨架 | 无 |
| **1.3 Usage 真实数据** | 复用已有 `06-09-real-data-integration` 任务中 R3 的设计，接入 `stats-cache.json` 和 Codex SQLite | 1.2 |

**验收**：
- `pnpm tauri:dev` 启动后显示 5 个视图
- 在终端运行 `which claude` 有结果时，BYOA 管道能调用并返回 JSON
- Usage 视图展示本机真实 token/cost 数据

### Phase 2: 核心链路前半——发现 + 安装

**目标**：用户可以从多平台热榜发现 harness 范式，并一键安装到本地。

| 子任务 | 内容 | 依赖 |
|--------|------|------|
| **2.1 多平台爬取** | Rust 侧实现四个 crawler（GitHub trending HTML 解析、HN API、Reddit API、linux.do Discourse JSON）；前端爬取按钮和进度展示 | 无 |
| **2.2 关键词粗筛** | 本地字符串匹配过滤器，可配置关键词列表（claude, codex, AI coding, harness, agent, prompt, CLAUDE.md, AGENTS.md, skill, hook, MCP...） | 2.1 |
| **2.3 Agent 语义精排** | 粗筛结果打包为一个 prompt，通过 BYOA 管道调用本地 agent，返回按相关性排序的结果 | 1.1, 2.2 |
| **2.4 策展内容加载** | 从 hone-registry 仓库 fetch 最新 YAML，合并到 Discover 展示（策展内容置顶） | 2.1 |
| **2.5 Discover 视图** | 双区域 UI：工具雷达（仓库）+ 社区脉搏（讨论），搜索过滤，范式类型标签 | 2.1-2.4 |
| **2.6 一键安装** | 从 Discover 条目到本地环境的安装流程：选择 target → 选择安装动作 → 预览变更 → 确认执行 → 记录安装历史 | 2.5 |

**验收**：
- 点击"更新热榜"后 10-15 秒内展示过滤后的结果
- 策展内容置顶显示
- 可以从一个 GitHub 仓库中选择 skill 文件，一键复制到 `~/.claude/skills/`
- 安装历史可在 Settings 中查看

### Phase 3: 核心链路后半——闭环 + 入口

**目标**：Insights 能调用本地 agent 生成优化建议，用户确认后写回配置。MenuBar 作为每日入口。

| 子任务 | 内容 | 依赖 |
|--------|------|------|
| **3.1 Insights 真实数据** | 基于真实 Usage 数据生成洞察（token 异常、模型集中度、活跃度变化、配置漂移） | 1.3 |
| **3.2 AI 建议生成** | 每条 Insight 带"生成建议"按钮：将 Insight 上下文 + 当前 Profile 状态打包为 prompt → BYOA 调用 → 解析为 OptimizationSuggestion | 1.1, 3.1 |
| **3.3 建议确认与写回** | 建议预览 UI（展示 proposed change 的 diff）→ 用户确认 → 执行写入（复用一键安装的 InstallAction 机制）→ 更新 SuggestionStatus | 2.6, 3.2 |
| **3.4 MenuBar 重做** | 重写面板内容：今日热点标题 + 待处理建议数 + 今日成本 + "更新热榜"/"打开工作台"按钮 | 2.5, 3.1 |

**验收**：
- Insights 视图展示基于真实数据的洞察（非 fixture）
- 点击"生成建议"调用本地 agent 并返回结构化建议
- 确认建议后，对应文件被修改且变更可回溯
- MenuBar 展示最新热点和待处理建议数

### Phase 4: 扩展性

**目标**：Target adapter 抽象，为支持更多 AI coding 工具做准备。

| 子任务 | 内容 | 依赖 |
|--------|------|------|
| **4.1 Adapter trait** | 定义 `TargetAdapter` trait：`detect()`, `read_config()`, `install_skill()`, `append_rule()`, `add_mcp()`, `install_hook()` | Phase 2-3 完成 |
| **4.2 重构现有实现** | 将 Claude Code 和 Codex 的读写逻辑重构为两个 adapter 实现 | 4.1 |
| **4.3 文档** | 编写"如何添加新 Target Adapter"的贡献指南 | 4.2 |

**验收**：
- 新增一个 Target（如 Cursor）只需实现 trait，不改核心逻辑
- 贡献指南可指导外部开发者添加 adapter

## 与现有任务的关系

- `06-09-real-data-integration`：其中 R3（Usage 真实数据）和 R5（Registry/Skills 扫描）的设计可复用到 Phase 1.3 和 Phase 2。其余 requirement（R1 Profile、R4 Sync Governance、R6 三向 diff、R7 Wake Control）在新方向中降级或合并，不再作为独立需求。
- `06-07-implement-harnessdeck-macos-app`：已完成的 Tauri 骨架作为本任务的保留基础设施。

## 约束

1. **macOS only**：不考虑 Windows/Linux 适配
2. **本地优先**：不跑后端服务，所有爬取和 agent 调用在客户端完成
3. **只读为主**：除一键安装和建议写回外，不修改用户环境
4. **安全脱敏**：agent 调用的 prompt 不包含用户源代码或 secret
5. **Fixture fallback**：浏览器开发模式（`pnpm dev`）保留 fixture 数据
6. **中英双语**：UI 文案同步更新 zh-CN 和 en-US
