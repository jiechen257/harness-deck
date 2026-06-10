# Hone 核心重写 Session Handoff

## 用户与环境 / User & Environment

- **用户**：jiechen（git user）
- **工作目录**：`/Users/zhici/per-pro/harness-deck`
- **当前分支**：`main`（所有改动未提交，45 个文件 modified/untracked）
- **目标合并分支**：`main`
- **平台**：macOS（Darwin 25.5.0）
- **技术栈**：Tauri 2 + React + TypeScript + Rust

### 开发命令

```bash
pnpm install                                     # 安装依赖
pnpm dev                                         # vite 开发服务器 localhost:1420
pnpm tauri:dev                                   # 完整 Tauri 桌面应用
pnpm lint                                        # eslint，零警告要求
pnpm typecheck                                   # tsc --noEmit
pnpm test                                        # vitest run (jsdom)
cargo test --manifest-path src-tauri/Cargo.toml  # Rust 测试
```

### 用户偏好与硬约束

- **语言**：代码注释英文，文档/UI 文案中英双语（zh-CN 默认）
- **Lint**：`@typescript-eslint/no-explicit-any` 设为 error，lint 零警告
- **Git**：不要自动提交，需要用户确认
- **Trellis**：项目使用 `.trellis/` 工作流，任务在 `.trellis/tasks/` 下
- **CLAUDE.md**：项目指引在 `/Users/zhici/per-pro/harness-deck/CLAUDE.md`（需要更新以匹配新产品方向）

---

## 当前正在处理的事项 / Current Task

**产品从 HarnessDeck 转型为 Hone**——一个帮助个人开发者发现、应用并持续优化 AI coding 范式的 macOS 本地工具。核心链路：Discover（多平台热榜聚合）→ Apply（一键安装）→ Observe（真实用量）→ Optimize（agent 驱动的闭环建议）。

**当前状态**：Phase 1（地基）和 Phase 2（发现+安装）已完成并通过所有验证。工作区有 45 个文件的改动未提交。下一步是 Phase 3（Insights 闭环 + MenuBar 重做）。

---

## 本会话已完成的工作 / History

### 产品方向 Grill-me（19 个决策）

通过 `/grill-me` 流程逐一解决了 19 个产品方向分支：
- 反馈闭环：Insight → BYOA agent 生成建议 → 用户确认 → 写回配置
- BYOA 模式：调用用户本地已安装的 Claude Code / Codex CLI 子进程，不直连 API
- 发现范式粒度：仓库级（framework/collection/methodology），不是配置文件级
- 信息源：GitHub trending（Search API 替代）+ HN + Reddit + linux.do + 手工策展
- 爬取触发：用户手动，每日一次，客户端本地执行
- "应用"模型：一键安装为主路径，持续同步降为 Settings 高级功能
- 视图精简：9 → 5（Home / Discover / Usage / Insights / Settings）
- 目标用户：个人重度 AI coding 用户
- 分发：完全开源 GitHub
- Target 工具：MVP Claude Code + Codex，架构 adapter pattern 可扩展
- 代码策略：核心重写，保留 Tauri 骨架
- MenuBar：每日一瞥（热点 + 待处理建议数 + 成本 + 快捷操作）
- 产品名：Hone
- 平台：macOS only
- 策展内容：独立仓库 `hone-registry`（未创建，MVP 用硬编码策展列表）

### Phase 1 — 地基（3 个子任务）

**1.1 BYOA 管道（Rust）**
- 新建 `src-tauri/src/domain/byoa.rs`：`AgentKind`、`AgentAvailability`、`AgentInvocation`、`AgentResult`
- 新建 `src-tauri/src/services/byoa_service.rs`：`detect_agent()`（runs `which`）、`detect_all_agents()`、`invoke_agent()`（subprocess spawn + 超时 polling + JSON 解析）
- 新建 `src-tauri/src/commands/byoa_commands.rs`：`detect_agents`（sync）+ `invoke_agent`（async，用 `spawn_blocking`——项目首个 async command）
- 新建 `src-tauri/src/byoa_tests.rs`：3 个测试
- `src-tauri/src/domain/errors.rs`：添加 `subprocess()` 和 `timeout()` 构造器
- `src/lib/types.ts` 和 `src/lib/api.ts`：添加前端类型镜像和 `detectAgents()`/`invokeAgent()` API

**1.2 导航重构（前端 9→5）**
- `src/constants/types.ts`：`ViewId` 从 9 个缩减为 5 个（`home | discover | usage | insights | settings`）
- `src/constants/navigation.ts`：`navItems` 改为 5 项（Home/Discover/Usage/Insights/Settings），删除 `matches` 数组、`secondaryViewsFor()`，简化 `isNavSelected()`
- `src/components/views/SettingsView.tsx`：从 81 行扩展到 ~310 行，内部 5-tab 系统（General / Installed / Sync / Guard / Wake），吸收原 GuardView/ProfileView/SyncView/OperateView 的完整内容
- `src/App.tsx`：删除 4 个旧视图 import、删除二级侧边栏逻辑、视图渲染简化为 5 路 flat conditional、品牌改为 "Hone"
- `src/components/views/HomeView.tsx`：dashboard cards 从 6 张调整为 4 张（Discover/Usage/Insights/Settings）
- `src/constants/copy.ts`：全面更新为 Hone 品牌文案
- `src-tauri/tauri.conf.json`：`productName` → "Hone"，`identifier` → "com.hone.desktop"
- 删除 `GuardView.tsx`、`ProfileView.tsx`、`SyncView.tsx`、`OperateView.tsx`
- `src/App.test.tsx`：从 15 个测试重写为 13 个，匹配新 5-view 结构

**1.3 真实数据接入（前端）**
- `UsageView.tsx`：删除 `usageSummary: UsageSummary` fixture prop，`getRealUsageSummary()` 成为唯一数据源
- `InsightsView.tsx`：删除 `insights: Insight[]` fixture prop，`listRealInsights()` 成为唯一数据源
- App.tsx 中对应 state/props 清理

### Phase 2 — 发现 + 安装（2 个子任务）

**2.1-2.4 后端**
- `src-tauri/Cargo.toml`：添加 `reqwest`（json + rustls-tls）和 `tokio`（time + macros）
- 新建 `src-tauri/src/domain/crawl.rs`：`CrawlSource`/`ItemType`/`CrawlItem`/`CrawlResult`/`CrawlSummary`/`InstallTarget`/`InstallAction`/`InstallRequest`/`InstallResult`
- 新建 `src-tauri/src/services/crawl_service.rs`：4 个 async crawler（`crawl_github`/`crawl_hackernews`/`crawl_reddit`/`crawl_linuxdo`），`keyword_filter`，`load_curated_registry`（superpowers/waza/OpenSpec），`crawl_all`（tokio::join! 并发），`rank_with_agent`（调 BYOA）
- 新建 `src-tauri/src/services/install_service.rs`：`install_skill`（创建 skill 目录 + SKILL.md）
- 新建 `src-tauri/src/commands/crawl_commands.rs`：`crawl_all_sources`（async）、`rank_crawl_results`（async）、`install_skill_command`（sync）
- `src/lib/types.ts` 和 `src/lib/api.ts`：添加 Crawl/Install 类型和 `crawlAllSources()`/`rankCrawlResults()`/`installSkill()` API

**2.5-2.6 前端**
- `src/components/views/DiscoverView.tsx`：完全重写为自足化组件（~270 行）。4 个区域：策展推荐 → 工具雷达（GitHub）→ 社区脉搏（HN/Reddit/linux.do）→ 已安装 Skills。"更新热榜"按钮 + "Agent 精排"按钮 + 安装按钮（选择 target → 确认 → 执行 → 刷新）
- App.tsx：DiscoverView 不再需要外部 props

---

## 下一步待做 / Next Steps

### 0. 提交当前改动（建议分 2 个 commit）

```bash
# Commit 1: Phase 1 — 重命名 + 导航重构 + BYOA + 真实数据
git add README.md src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock \
  src/constants/ src/App.tsx src/App.test.tsx \
  src/components/views/SettingsView.tsx src/components/views/HomeView.tsx \
  src/components/views/UsageView.tsx src/components/views/InsightsView.tsx \
  src/components/menubar/MenuBarPanel.tsx src/components/shared/HarnessLogo.tsx \
  src/lib/types.ts src/lib/api.ts src/styles/app.css \
  src-tauri/src/domain/byoa.rs src-tauri/src/domain/errors.rs src-tauri/src/domain/mod.rs \
  src-tauri/src/services/byoa_service.rs src-tauri/src/services/mod.rs \
  src-tauri/src/commands/byoa_commands.rs src-tauri/src/commands/mod.rs \
  src-tauri/src/lib.rs src-tauri/src/byoa_tests.rs \
  src-tauri/capabilities/default.json src-tauri/icons/ \
  .trellis/tasks/06-09-hone-core-rewrite/

git rm src/components/views/GuardView.tsx src/components/views/ProfileView.tsx \
  src/components/views/SyncView.tsx src/components/views/OperateView.tsx

# Commit 2: Phase 2 — 爬取管道 + 一键安装 + Discover 重做
git add src-tauri/src/domain/crawl.rs src-tauri/src/services/crawl_service.rs \
  src-tauri/src/services/install_service.rs src-tauri/src/commands/crawl_commands.rs \
  src/components/views/DiscoverView.tsx src/lib/types.ts src/lib/api.ts \
  src-tauri/Cargo.toml src-tauri/Cargo.lock
```

### 1. Phase 3: Insights 闭环（PRD 在 `.trellis/tasks/06-09-hone-core-rewrite/prd.md` Phase 3 节）

| 子任务 | 文件 | 具体改动 |
|--------|------|----------|
| **3.1 Insights 真实数据** | `src/components/views/InsightsView.tsx` | 已完成（Phase 1.3 做了）——确认 `listRealInsights()` 返回 TokenAnomaly/SessionActivity/ModelConcentration |
| **3.2 AI 建议生成** | `InsightsView.tsx` + 可能新建 `src-tauri/src/services/suggestion_service.rs` | 每条 Insight 加"生成建议"按钮 → 调用 BYOA `invokeAgent()` → 将 Insight 上下文 + 当前 Profile 状态打包为 prompt → 解析返回的 OptimizationSuggestion |
| **3.3 建议确认与写回** | `InsightsView.tsx` + `install_service.rs` 扩展 | 建议预览 UI → 用户确认 → 复用 `InstallAction` 机制写入配置 → 更新状态 |
| **3.4 MenuBar 重做** | `src/components/menubar/MenuBarPanel.tsx` | 内容改为：今日热点标题 + 待处理建议数 + 今日成本 + "更新热榜"/"打开工作台"按钮 |

**推荐**：3.2 是最核心的——它是闭环的关键一环。prompt 模板需要精心设计，确保 agent 返回结构化的 JSON 建议。可以参考 `crawl_service.rs` 中 `rank_with_agent()` 的 prompt 模式。

### 2. Phase 4: Target Adapter 抽象

优先级低，建议等 Phase 3 闭环验证后再做。

### 3. CLAUDE.md 更新

当前 `CLAUDE.md` 仍然描述旧的 9 视图 HarnessDeck 架构。需要更新为 Hone 的 5 视图结构、新 domain 模型和新 service 层。

---

## 关键文件速查 / Key Files Index

### 前端 — UI 与视图

| 文件 | 角色 |
|------|------|
| `src/App.tsx` | 应用 Shell：窗口判断、5 视图路由、全局状态、快捷键 |
| `src/components/views/DiscoverView.tsx` | 自足化 Discover 视图：爬取触发、精排、安装、本地 skill 展示 |
| `src/components/views/UsageView.tsx` | 自足化 Usage 视图：调用 `getRealUsageSummary()` |
| `src/components/views/InsightsView.tsx` | 自足化 Insights 视图：调用 `listRealInsights()`，**Phase 3 的主要改动点** |
| `src/components/views/SettingsView.tsx` | 5-tab 设置视图（General/Installed/Sync/Guard/Wake） |
| `src/components/views/HomeView.tsx` | 仪表盘，4 张卡片 |
| `src/components/menubar/MenuBarPanel.tsx` | 菜单栏弹出面板，**Phase 3 需重做内容** |
| `src/constants/types.ts` | `ViewId` 类型定义（5 个值） |
| `src/constants/navigation.ts` | 5 项 navItems，无二级侧边栏 |
| `src/constants/copy.ts` | 中英文 UI 文案 |

### 前端 — 数据层

| 文件 | 角色 |
|------|------|
| `src/lib/types.ts` | 所有 TypeScript 类型，镜像 Rust domain（含 BYOA/Crawl/Install 类型） |
| `src/lib/api.ts` | Tauri command 封装 + 浏览器 fixture fallback（`call()` 包装器） |

### 后端 — Domain

| 文件 | 角色 |
|------|------|
| `src-tauri/src/domain/byoa.rs` | AgentKind/AgentAvailability/AgentInvocation/AgentResult |
| `src-tauri/src/domain/crawl.rs` | CrawlSource/CrawlItem/CrawlResult/CrawlSummary/Install* 类型 |
| `src-tauri/src/domain/errors.rs` | CommandError 统一错误类型（含 subprocess/timeout 构造器） |

### 后端 — Services

| 文件 | 角色 |
|------|------|
| `src-tauri/src/services/byoa_service.rs` | agent CLI 检测 + 子进程调用 |
| `src-tauri/src/services/crawl_service.rs` | 4 平台爬取 + 关键词过滤 + agent 精排 + 策展加载 |
| `src-tauri/src/services/install_service.rs` | skill 一键安装（创建目录 + SKILL.md） |
| `src-tauri/src/services/usage_service.rs` | 真实用量数据读取（stats-cache + SQLite） |
| `src-tauri/src/services/insight_service.rs` | 真实洞察生成（token anomaly / session activity / model concentration） |

### 后端 — Commands + 注册

| 文件 | 角色 |
|------|------|
| `src-tauri/src/commands/byoa_commands.rs` | detect_agents + invoke_agent |
| `src-tauri/src/commands/crawl_commands.rs` | crawl_all_sources + rank_crawl_results + install_skill_command |
| `src-tauri/src/lib.rs` | `generate_handler![]` 注册所有 Tauri command |

### 测试

| 文件 | 角色 |
|------|------|
| `src/App.test.tsx` | 13 个前端集成测试（5 视图导航、快捷键、Settings tabs、品牌） |
| `src-tauri/src/byoa_tests.rs` | 3 个 BYOA 管道测试 |
| `src-tauri/src/tests/` | 29 个其他 Rust 测试（profile/deploy/usage/insight/reader 等） |

### 项目管理

| 文件 | 角色 |
|------|------|
| `.trellis/tasks/06-09-hone-core-rewrite/prd.md` | 完整的 Phase 1-4 路线图和验收标准 |
| `.trellis/tasks/06-09-hone-core-rewrite/task.json` | Trellis 任务元数据 |
| `README.md` | 已更新为 Hone 产品文档 |

---

## 调试 / 验证方法 / Debug & Verification

```bash
# 完整验证链
pnpm typecheck && pnpm lint && pnpm test && cargo test --manifest-path src-tauri/Cargo.toml

# 浏览器模式（fixture 数据，不需要 Rust 后端）
pnpm dev
# 打开 http://localhost:1420 检查 5 个视图

# Tauri 桌面模式（真实数据）
pnpm tauri:dev
# 检查：
#   1. Cmd+1-5 快捷键映射到 Home/Discover/Usage/Insights/Settings
#   2. Discover → 点击"更新热榜" → 10-15 秒后展示爬取结果
#   3. Usage 显示来自 ~/.claude/stats-cache.json 的真实 token/cost
#   4. Settings > 5 个 tab 各有内容
#   5. 窗口标题显示 "Hone"

# 检查 BYOA 管道是否工作
# 在 Tauri dev 的 WebView console 中执行：
# (await window.__TAURI_INTERNALS__.invoke("detect_agents"))

# 检查一键安装是否工作
# 安装后检查目标目录是否创建了文件：
ls ~/.claude/skills/ | head -20
ls ~/.codex/skills/ | head -20
```

---

## 需要用户定夺的点 / Open Decisions

1. **是否先提交当前改动再开始 Phase 3？** 工作区有 45 个文件未提交（+1782/-1037 行）。建议先分 2 个 commit 提交。

2. **Phase 3 的 Insight → 建议 prompt 模板怎么设计？** 当前有两个参考：`crawl_service.rs` 的 `rank_with_agent()` 和 `byoa_service.rs` 的 `invoke_agent()`。建议生成的 prompt 需要包含哪些上下文（当前 Profile 完整内容？还是只要摘要？）。

3. **MenuBar 重做是否需要新的数据接口？** 当前 MenuBar 接收的 props（usageSummary/manifest/profiles）大部分是旧方向的。Phase 3 需要新增"待处理建议数"和"今日热点标题"的数据源——这些是通过 App.tsx state 传入还是 MenuBar 自己 fetch？

4. **CLAUDE.md 是否在 Phase 3 之前更新？** 当前 CLAUDE.md 仍描述旧架构。如果 Codex 或其他 agent 会基于 CLAUDE.md 工作，应该先更新。
