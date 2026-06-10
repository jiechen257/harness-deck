# Hone 产品定位校正与最佳实践闭环原型

## Goal

重新校正 Hone 的产品定位和功能闭环，使它从“多平台爬取工具”回到“帮助个人开发者持续跟进、应用、评估并同步 harness engineering 最佳实践”的本地优先桌面应用。

本任务处于规划阶段，目标是先通过需求访谈和原型讨论收敛产品定义、信息架构和主要交互，不直接进入代码实现。

## Product Starting Point

Hone 的出发点是解决个人开发者很难持续感知、理解和落地最新 harness engineering 实践的问题。产品要形成正向循环：

```text
挖掘信息源
  -> 整理最佳实践
  -> 应用最佳实践到本地
  -> 分析本地实践方式并反馈优化
  -> 方案沉淀和多 agent 同步
  -> 其他本机 agent 使用配置
```

产品可以处理一部分信息资讯工作，但资讯不是终点；资讯的价值必须落到本地 agent 使用范式的改进。

## Positioning

- 开源 macOS 桌面端应用。
- 通过 GitHub Release 和 Homebrew 分发。
- 全部功能本地实现，不依赖服务端逻辑。
- 可以访问公开信息源，也可以调用本地 Codex / Claude 做信息整理、语义判断和本地实践 review。
- 默认不上传 prompts、source code、完整 logs 或 secrets。

## Decisions

### D1. 主导航按最佳实践对象和闭环组织

主导航使用“最佳实践对象 / 最佳实践闭环”作为产品主语，信息源采集降级为 intake 能力。

推荐的信息架构方向：

```text
Home
Practice Library
Apply & Sync
Local Review
Operations
Settings
```

其中 GitHub Trending、linux.do、Hacker News、Reddit 等来源放入 `Practice Library` 的 Sources / Intake 区域，服务于最佳实践卡片沉淀，不作为产品主入口。

### D2. Practice Card、Local Asset、Operations Script 拆成独立对象

产品模型拆成三类对象，避免把资讯、可安装资产和本机操作脚本混成一种卡片。

- `Practice Card`：表达“这个实践是什么、解决什么问题、适用场景、同类方案、来源可信度”。类型包括 Product、Skill、MCP、Workflow、Methodology。
- `Local Asset`：表达“可以落到本地 agent 环境的资产”。类型包括 Skill、MCP config、Rule、Hook、Agent profile fragment。
- `Operations Script`：表达“本机 agent 使用环境的辅助脚本”。例如 `~/start-codex.sh`、`~/dsleep`、`~/dwake`。

`Practice Card` 可以关联或生成一个或多个 `Local Asset`，但两者拥有独立生命周期。`Operations Script` 进入 Operations 区域，不归入 Practice Library。

### D3. Local Asset 使用 registry repo + SQLite 双层真相

`Local Asset` 采用“双层真相”模型：

```text
Practice Card / metadata / audit -> SQLite
Skill / rule / hook / MCP file assets -> registry repo
Claude/Codex target dirs -> symlink or copied projection
```

- registry repo 是文件资产真相来源，保存 skill、rule、hook、MCP 片段等可被 agent 直接读写、Git 版本管理和人工审阅的内容。
- Hone SQLite 是索引、状态、关系和审计来源，保存 Practice Card、Local Asset metadata、安装记录、来源关联、review 结果和用户决策。
- Claude Code / Codex 等 target 目录是投射结果，优先通过 symlink 或可回滚复制从 registry repo 安装，不作为唯一真相来源。
- UI 必须展示 registry 源路径、target 投射路径、安装方式、同步状态和最近审计记录。

### D4. MVP 真实同步目标限定为 Claude Code + Codex

MVP 的真实读写、安装、同步、diff、备份和回滚只覆盖 Claude Code 与 Codex。

- Cursor、Windsurf、Claude Desktop 等工具可以在数据模型和 adapter 接口中预留，但 UI 中只能标记为未配置 / 后续支持，不执行真实同步。
- 第一版必须先跑通 registry repo -> target projection -> diff -> backup -> audit 的闭环。
- 新 target 的支持必须通过 adapter 增量接入，不能把目标差异写散在 UI 或业务逻辑中。

### D5. Operations 是独立主视图

`Operations Script` 属于本机 agent 操作环境的运行控制，不放进 Settings 的低频配置区。

- `Operations` 作为独立主视图，管理脚本、运行状态、确认、日志、最近执行记录和高频动作。
- `~/start-codex.sh` 这类脚本涉及代理环境、`launchctl` 和 Codex 重启，必须展示影响范围和执行结果。
- `~/dsleep` / `~/dwake` 这类脚本涉及 `caffeinate`、`pmset displaysleepnow` 和进程管理，必须有明确状态、停止入口和审计记录。
- 菜单栏面板可以暴露 Operations 的安全快捷动作，但高风险动作仍需确认。

### D6. Local Review 首版聚焦本地 harness 资产结构

`Local Review` 首版分析“本地 harness 资产结构”，不把 token / cost 用量作为主分析对象。

首版分析对象：

```text
registry repo
  -> skills / rules / hooks / MCP fragments
Claude Code target
  -> ~/.claude/skills / CLAUDE.md / settings / MCP
Codex target
  -> ~/.codex/skills / AGENTS.md / config.toml / MCP
Projection state
  -> symlink/copy 是否一致、是否断链、是否 drift
Practice relation
  -> 哪些 Local Asset 没有关联 Practice Card，哪些卡片还没落地
```

首版建议类型：

- 冗余：Claude / Codex 有重复或过期 skill。
- 漂移：target 中内容和 registry 不一致。
- 缺失：某个 target 没同步关键 asset。
- 替换：某个 Local Asset 可被更新实践替代。
- 孤儿：本地 asset 没来源、没说明、没归属。

token / cost 可以保留在 Home 或附加观察里，但不作为 Local Review 第一主线。

### D7. 内置信息挖掘和最佳实践整理能力采用 System Practice Skill

产品内置的信息源挖掘、最佳实践标准化和本地 review 能力采用 `System Practice Skill` 形态，执行层仍然调用用户本地 Codex / Claude。

建议的文件形态：

```text
registry repo / system-skills / intake-source-research / SKILL.md
registry repo / system-skills / normalize-practice-card / SKILL.md
registry repo / system-skills / local-harness-review / SKILL.md
```

- Hone 带默认副本，用于首次启动和恢复。
- 文件资产放 registry repo，便于 Git 审阅、版本化、复制和迁移。
- SQLite 记录系统 skill 的版本、启用状态、执行历史、输出卡片和用户决策。
- UI 允许查看、复制到个人 registry、禁用或升级系统 skill，但不能悄悄改写执行逻辑。
- 系统 skill 和用户安装的 `Local Asset` 分开标记，避免混淆系统能力和用户资产。

### D8. changelog 和模型讯息使用 Signal Card

changelog、模型讯息和社区热度先进入 `Signal Card`，不能直接混入 `Practice Card`。

```text
Signal Card
  -> Codex desktop changelog
  -> Claude Code changelog
  -> model release / capability / pricing / availability
  -> community discussion spike

Practice Card
  -> 经过整理后可解释、可沉淀、可应用的实践
```

- `Signal Card` 表达事实信号：发生了什么、来源是什么、发布时间是什么、可信度如何、可能影响哪些本地对象。
- `Practice Card` 表达沉淀后的实践：为什么重要、适用场景、同类方案、如何落地、是否能生成 `Local Asset`。
- 一个 `Signal Card` 可以被系统 skill 转化或关联到一个或多个 `Practice Card`。
- UI 必须避免把 changelog / 模型信息做成资讯流终点；它们是 Practice Library 的输入。

### D9. 信息源刷新默认手动，可选本地定时

信息源刷新默认手动触发，首次启动不自动联网。用户可以显式开启本地每日定时刷新。

默认行为：

- 首次启动不自动访问外部来源。
- 用户点击 `Refresh Signals` / `更新信号` 后才访问外部信息源。
- 每次刷新都记录来源、时间、成功 / 失败、结果数量和错误原因。

可选行为：

- 用户可开启“每日本地刷新”。
- 每个 source 可独立开关，包括社区来源、产品 changelog、模型讯息来源。
- 刷新频率可配置，但 MVP 默认只需要 daily。
- 菜单栏面板只显示新 Signal 数、待整理数量和高影响更新，不自动执行整理或安装。
- 所有刷新记录写入 SQLite audit。

### D10. MVP 第一屏是闭环状态总览

MVP 第一屏使用 `Home` 闭环状态总览，不直接进入 `Practice Library` 列表。

第一屏展示：

```text
Home
  - Signals: 新信号 / 待整理 / 高影响 changelog
  - Practices: 已沉淀 / 可应用 / 待更新
  - Local Assets: registry 状态 / Claude 投射 / Codex 投射
  - Review: drift / orphan / missing / replacement 建议
  - Operations: Codex 启动代理 / 防睡状态 / 最近脚本执行
```

入口关系：

```text
Signals / Practices -> Practice Library
Local Assets -> Apply & Sync
Review -> Local Review
Operations -> Operations
```

第一屏目标是让用户立即判断“当前 harness practice 健康吗，下一步该处理什么”，避免产品心智退回信息列表或卡片管理器。

### D11. Practice Library 主体验采用管道式工作流

`Practice Library` 主体验采用“从信号到实践再到落地”的管道式工作流，底层仍支持对象库检索。

核心管道：

```text
Inbox Signals
  -> Normalize to Practice Card
  -> Link / Generate Local Asset
  -> Apply & Sync
  -> Review feedback
```

UI 可以使用 4 个分栏或 4 个 tabs：

```text
Signals | Practices | Assets | Archived
```

- 默认入口强调处理状态：待整理 Signal、待应用 Practice、待同步 Asset、已归档对象。
- 对象库能力用于搜索、筛选、回溯和数据管理，不作为第一心智。
- 每个对象必须有状态字段，避免 Practice Library 退化成无差别收藏夹。

### D12. Apply & Sync 默认使用 symlink 投射

`Apply & Sync` 默认使用 symlink 将 registry repo 中的 `Local Asset` 投射到 Claude Code / Codex target 目录，copy 仅作为 fallback / compatibility mode。

默认投射：

```text
registry repo
  -> ~/.claude/skills/<name>  symlink
  -> ~/.codex/skills/<name>   symlink
```

安全机制是硬性要求：

- 预览：执行前显示将创建、更新、跳过哪些 link。
- 冲突处理：target 已有普通目录或普通文件时不覆盖，提示 import / adopt / skip。
- 断链检测：`Local Review` 必须标记 broken symlink。
- 回滚：删除 target link，不删除 registry 源文件。
- copy fallback：仅用于不支持 symlink 的 target 或用户明确选择的兼容模式。
- drift 检测：copy 模式下必须计算源与 target 的差异，提示重新投射或 adopt。
- 审计：每次投射、跳过、冲突、回滚都写入 SQLite audit。

### D13. 未托管 target 资产允许显式 adopt 到 registry

当 Claude Code / Codex target 目录中存在 Hone 未管理的普通目录或文件时，默认只提示冲突并 skip，不覆盖、不移动、不自动吸收。

允许用户显式执行 `adopt`，把未托管资产迁移进 registry repo，并重新以 symlink 投射到 target。

adopt 流程：

```text
1. Detect unmanaged asset
2. Show source path + parsed metadata + risk
3. User chooses Adopt
4. Copy into registry repo under selected category
5. Record Local Asset metadata in SQLite
6. Rename / backup original target directory or file
7. Create symlink from target to registry asset
8. Write audit record
```

安全要求：

- adopt 必须由用户逐项确认，不能批量默认执行。
- adopt 前必须展示目标 registry 路径和 backup 路径。
- adopt 后必须能从 audit 看到原始路径、registry 路径、target symlink 和时间。
- adopt 失败时不能删除原始 target 资产。

### D14. SQLite 保存结构化摘要和决策，不保存完整原文

SQLite 保存用于 UI、搜索、状态、审计和离线管理的结构化摘要、metadata、关系和用户决策；不保存完整外部网页、完整 changelog 原文、完整 thread dump、完整本地源码 / logs 或 secrets。

SQLite 保存：

```text
Signal Card:
  - title / source / url / published_at / fetched_at
  - signal_type / confidence / impact summary
  - short excerpt or normalized summary
  - processing status

Practice Card:
  - title / type / summary
  - scenarios / comparable items / applicability
  - source signal ids
  - generated_by system skill version
  - user decisions / status

Local Asset metadata:
  - registry path / target path / projection mode
  - checksum / status / audit refs
```

SQLite 不保存：

```text
完整网页正文
完整 changelog 原文
完整 Reddit / HN / forum thread dump
完整本地 source code / logs
secrets
```

原文仅保存 URL、短摘录、哈希或本地缓存引用。需要重新分析时，由系统 skill 按权限和来源重新获取。

### D15. 模型讯息和产品 changelog 使用三层可信度

模型讯息和产品 changelog 的 `Signal Card` 必须标记 source tier、发布时间、抓取时间和可信状态。

可信度分层：

```text
Official
  - OpenAI / Anthropic 官方文档、release notes、blog、GitHub release
  - Codex / Claude Code 官方 changelog
  - 模型价格、能力、上下文、可用性等以官方源为准

Maintainer / Repository
  - GitHub repo README、release、issue、PR、讨论区
  - 工具作者说明
  - 可用于发现实践，但模型事实不能只靠它定论

Community
  - HN / Reddit / linux.do / blog / X 转述
  - 只能作为 Signal，不直接作为事实结论
```

规则：

- 模型事实必须有 Official 来源才标记 `confirmed`。
- 没有 Official 来源只能标记 `unverified` / `community-reported`。
- `Practice Card` 可以引用 Community 信号作为使用场景线索，但不能把它当能力事实。
- UI 必须展示 source tier、fetched_at、published_at 和可信状态。

### D16. Product Design 原型采用静态高保真 + 关键状态交互

本轮 Product Design 原型用于验证定位、信息架构和闭环心智，不实现真实数据链路。

必须覆盖：

```text
Home 闭环状态总览
Practice Library 管道：Signals / Practices / Assets / Archived
Practice Card detail
Apply & Sync 预览 + symlink / adopt 冲突状态
Local Review 建议列表
Operations 脚本状态
MenuBar 面板
```

关键交互：

```text
tab / view 切换
选中一个 Signal 看到转 Practice 的 preview
选中一个 Asset 看到投射预览和冲突
菜单栏面板展示新 Signal / drift / Operations 状态
```

不做：

```text
真实爬取
真实 SQLite
真实 agent 调用
真实文件写入
```

### D17. 视觉方向是 practice operations console

原型保留现有 command deck 的 macOS 原生工作台感觉，但弱化旧星图 / 装饰感，转向更密集的 `practice operations console`。

保留：

```text
macOS desktop / menu bar app 气质
浅色默认 + 深色支持
左侧菜单栏面板 + 右侧工作台的产品原型结构
克制工程美学
```

调整：

```text
减少星图 / 玄学感装饰
首页使用状态矩阵和任务队列，而不是大视觉 hero
Practice Library 使用管道 / 队列布局
Apply & Sync 使用 diff / projection plan / audit trail
Local Review 使用 issue list + evidence panel
Operations 使用 script state / run log / confirmation panel
```

目标是让用户第一眼感知这是本地 harness practice 运营台，而不是资讯流、卡片收藏夹或纯配置设置页。

### D18. MenuBar 面板优先展示待处理闭环状态

MenuBar 面板作为每日入口，采用混合入口，但主优先级是“待处理闭环状态”，不是信息流，也不是脚本启动器。

结构方向：

```text
MenuBar Panel
  - Today: 新 Signal / 高影响 changelog / 待整理数量
  - Practice Health: drift / orphan / missing / pending sync
  - Operations: Codex proxy status / sleep guard status
  - Quick Actions:
      - Refresh Signals
      - Open Local Review
      - Open Apply & Sync
      - Run safe operation
```

原则：

- 不展示长资讯列表。
- 不展示完整 Practice Library。
- 不自动整理、不自动安装、不自动写入。
- 高风险脚本动作必须跳转主窗口确认。
- 低风险状态刷新可以在面板内执行。

### D19. MVP 优先连接用户已有 registry，内置 starter registry 作为 fallback

MVP 同时支持用户已有 registry 和产品内置 starter registry，但默认优先连接用户已有 registry。

Primary:

```text
用户选择或自动识别本机 registry repo
例如 /Users/zhici/work-pro/my-agent-skill
```

Fallback:

```text
Hone bundled starter registry
  - system-skills 默认副本
  - 少量示例 Practice Card / Local Asset schema
  - 只读，不直接作为长期真相源
```

First-run:

```text
如果用户没有 registry，可以一键初始化到 ~/HoneRegistry 或用户指定路径
```

设计目标：

- 不割裂用户已有 `my-agent-skill` 资产。
- 开源产品不能假设所有用户已有 registry。
- starter registry 用于首次体验和恢复，不作为长期写入目标。

### D20. 首次启动采用分步授权

首次启动使用分步授权，不做一键全开。

First-run setup:

```text
1. Choose registry
   - Use existing registry
   - Initialize new registry
   - Use starter registry read-only

2. Local read access
   - Scan Claude Code
   - Scan Codex
   - Scan operations scripts
   - 每项单独授权

3. External signals
   - Community sources
   - Product changelog
   - Model news
   - 默认关闭，用户手动开启

4. Write permissions
   - Apply & Sync
   - Adopt unmanaged assets
   - Operations scripts
   - 默认关闭，到具体动作时再确认
```

原则：

- 本地读取、外部联网、本地写入、脚本执行必须分开授权。
- 首次启动可以先完成只读体验，不要求用户立即授权写入。
- 写入和高风险脚本执行必须在具体动作时再次确认。
- 授权状态、变更时间和撤销动作需要进入 Settings / Privacy。

### D21. 后续实现拆成父任务 + 子任务树

`hone-positioning-practice-loop` 作为父任务，负责产品定位、跨子任务验收和最终集成 review。后续实现拆成 5 个可独立规划、实现和验收的子任务：

```text
1. product-prototype
   - 静态高保真 + 关键状态交互
   - Home / Practice Library / Apply & Sync / Local Review / Operations / MenuBar

2. data-model-storage
   - SQLite schema
   - Signal Card / Practice Card / Local Asset / audit
   - registry repo 连接和 starter registry

3. system-practice-skills
   - system-skills 默认副本
   - intake / normalize / local-review
   - 本地 Codex / Claude 执行边界

4. apply-sync-registry
   - symlink projection
   - adopt / conflict / rollback / drift
   - Claude Code + Codex adapters

5. signals-intake
   - 社区来源
   - Codex / Claude Code changelog
   - 模型讯息可信度分层
   - 默认手动 + opt-in daily refresh
```

依赖关系：

- `product-prototype` 可先行，用于验证信息架构和视觉方向。
- `data-model-storage` 是 `system-practice-skills`、`apply-sync-registry`、`signals-intake` 的持久化基础。
- `apply-sync-registry` 必须在真实写入前依赖 `data-model-storage` 的 audit / metadata 设计。
- `signals-intake` 可以先用 fixture / static source 验证 UI，再接入真实来源。

### D22. 子任务推进顺序

子任务按以下顺序推进：

```text
1. product-prototype
2. data-model-storage
3. system-practice-skills
4. apply-sync-registry
5. signals-intake
```

原因：

- 先用产品原型锁定信息架构和视觉心智，避免实现继续偏向 crawler。
- 再做数据模型和持久化，给 system skill、sync 和 intake 提供统一对象边界。
- 真实写入和外部来源接入放在后面，避免在未稳定体验和数据模型前扩大风险。

### D23. product-prototype 先交付独立 HTML 原型

`product-prototype` 子任务先交付独立 HTML 原型，不直接改现有 React app。

交付位置：

```text
docs/product-design/hone-practice-operations-prototype.html
```

原则：

- 原型用于验证信息架构、视觉心智和关键状态交互。
- 不接真实爬取、SQLite、agent 调用或文件写入。
- 不污染当前已有 React app 方向性改动。
- 用户确认原型后，再进入 React 实现任务。

### D24. 进入三方案视觉 ideation

Product Design brief 已确认，可以进入三方案视觉 ideation。

约束：

- 生成 3 个互相独立的视觉方向。
- 每个方向都必须围绕 `practice operations console`，避免回到 crawler / news feed / card collection 心智。
- 视觉方向用于选择后续 HTML 原型 target，不直接进入实现。
- 现有 `docs/product-design/harnessdeck-command-deck-prototype.html` 和 `docs/product-design/harnessdeck-b1-static-directions.html` 作为本地视觉上下文，但不照搬旧 9 视图信息架构。

### D25. HTML 原型选择 Loop Status Console 方向

三方案视觉 ideation 中选择方案 1：`Loop Status Console`。

该方向作为 `docs/product-design/hone-practice-operations-prototype.html` 的视觉目标：

- Home 第一屏以闭环状态矩阵为核心。
- 左侧 MenuBar panel 展示 Today、Practice Health、Operations、Quick Actions。
- 主工作台展示 Signals、Practices、Local Assets、Review、Operations 五个闭环状态带。
- 右侧保留 Next Decisions、Targets、Audit Trail。
- 视觉基调为浅色 macOS operations console，克制、密集、偏状态和下一步处理。

### D26. 产品 logo 在 HTML 原型中提供多方案选择

当前 fader / Command 图标语义偏“控制台工具 / 命令工具”，不足以表达 Hone 的新定位。

新 logo 需要结合当前功能和定位重新设计，并先在 `product-prototype` 的 HTML 原型中提供多套可比较方案，供用户后续选择。每套方案都需要表达：

- 持续闭环：Signal -> Practice -> Local Asset -> Projection -> Review。
- 本地优先：registry repo / SQLite / Claude + Codex target 都在本机。
- 安全投射：symlink、audit、确认、回滚。
- 个人开发者的 harness practice 运营台，而不是爬虫平台或资讯流。

HTML 原型中至少放入 4 个 logo 方向，并在同一页中展示 app icon、工作台标题和 MenuBar 面板预览：

- `Loop Projection`：用闭环轨道包裹 registry 源点，并投射到 Claude / Codex 两个目标节点。
- `Practice Compass`：用克制的方向环和检查点表达“从信号到实践再到 review”的运营节奏。
- `Registry Weave`：用 repo / branch / symlink 线束表达本地 registry 对多 agent target 的统一投射。
- `Audit Orbit`：用闭环、盾牌检查点和回滚刻度表达安全、确认和可追溯。

logo 选择延期到用户查看 HTML 原型后决定。本阶段不直接替换 React app 代码。

## Confirmed Repository Context

- 现有 `README.md` 已把产品写成 Hone，并描述 Discover -> Apply -> Observe -> Optimize 闭环。
- 现有 pending task `.trellis/tasks/06-09-hone-core-rewrite/prd.md` 已记录一次 19 个决策分支的转型，但 Phase 2 强调“多平台爬取 + 一键安装”，容易把产品重心推向 crawler。
- 当前代码已经存在 `crawl_service`、`DiscoverView`、`install_service`、`InsightsView` 等方向性实现痕迹。
- 旧原型 `docs/product-design/harnessdeck-command-deck-prototype.html` 仍是 9 视图 HarnessDeck 信息架构，和当前期望的最佳实践闭环不完全一致。
- `README.en.md` 仍保留旧 HarnessDeck 表述，需要后续在定位确认后同步。
- `/Users/zhici/work-pro/my-agent-skill/install.sh` 当前以 git repo 下的 `skills/<category>/<skill>/SKILL.md` 作为源，通过 symlink 投射到 `~/.claude/skills/` 和 `~/.codex/skills/`；安装过程是幂等的，并跳过 `pithos-*`、`dogfooding` 等特殊项。
- 当前代码中的 target / install 类型和 target adapter 基本限定为 Claude Code + Codex，符合 MVP 边界；后续扩展应沿 adapter 模式增加目标。
- `~/start-codex.sh` 会设置 Codex GUI 代理、写入 `launchctl` 环境并重启 Codex；`~/dsleep` / `~/dwake` 管理 `caffeinate` 和显示器睡眠，属于运行控制脚本。
- 当前 `crawl_service::rank_with_agent` 和前端 `InsightsView::buildSuggestionPrompt` 使用硬编码 prompt 调用本地 agent；后续需要改成产品可管理的内置能力。
- 当前 `ProductMark` 使用 Command / Shield / Cable 图标组合，`HarnessLogo` 使用 fader 图形；新定位下需要重新设计 logo。

## Problem To Correct

当前产品表达和功能优先级正在偏向“爬取公开社区平台并展示结果”。这会造成三个问题：

- 用户价值被误读成信息聚合，而不是 harness engineering 最佳实践的持续落地。
- Discover 变成主角，Apply / Analyze / Sync / Improve 的闭环被弱化。
- 本地 skill、MCP、rules、脚本和多 agent 适配的管理价值没有成为 UI 的核心。

## Requirements

### R1. 挖掘信息源

- 支持本地嗅探公开信息源，包括 GitHub Trending、linux.do、Hacker News、Reddit 等。
- 信息源目标是发现产品方案和实践方式，例如 OpenDesign、Hermes Agent、Superpowers、OpenSpec、skill、MCP、agent workflow、rules、hooks 等。
- 信息源还需要覆盖 Codex 桌面端、Claude Code 等核心工具的产品功能 changelog。
- 信息源还需要覆盖模型最新讯息，例如新模型发布、能力边界、工具调用能力、上下文窗口、价格 / 限额变化、可用区域和客户端支持状态。
- changelog 和模型讯息必须保留来源、发布时间、抓取时间和可信度标签，不能和社区传闻混成同一类事实。
- 模型事实只有 Official 来源才能标记 confirmed；社区转述只能作为 unverified Signal。
- 信息源采集应被表达为“输入管道”，不是产品主定位。
- 信息源采集在 UI 上属于 `Practice Library` 的 Sources / Intake 子能力。
- 用户应能手动触发、查看来源、查看采集时间、查看失败原因。
- 默认不自动联网；本地每日定时刷新必须由用户显式开启。

### R2. 整理最佳实践

- 通过本地 Codex 或 Claude 执行整理任务，产品不直连远端 LLM API。
- 至少抽象三类 `System Practice Skill`：信息源挖掘能力、最佳实践标准化/总结能力、本地 harness review 能力。
- 输出以 `Practice Card` 呈现，卡片至少包含：
  - 产品 / skill / MCP 的介绍。
  - 应用场景。
  - 同类产品或同类实践。
  - 来源和可信度线索。
  - 是否可应用到本地。
- `Practice Card` 不直接等同于可安装内容；可安装内容需要形成或关联 `Local Asset`。
- Codex / Claude Code changelog 和模型讯息先形成 `Signal Card`；只有经过整理并产生可解释、可沉淀、可应用结论后，才形成或关联 `Practice Card`。

### R3. 应用最佳实践到本地

- 对 skill / MCP 类实践，产品能整理并保存到本地，再通过 UI 同步到 Claude Code、Codex 或其他 agent。
- 对产品类实践，产品主要记录、归档和辅助理解，不负责替用户下载安装完整产品。
- 可安装内容以 `Local Asset` 表达，并记录来源 `Practice Card`、registry 源路径、目标 agent、目标路径、安装方式和当前状态。
- skill / rule / hook / MCP 等文件资产默认进入 registry repo，再从 registry repo 投射到目标 agent。
- 默认投射方式是 symlink；copy 仅作为 fallback / compatibility mode。
- target 中已有未托管资产时默认 skip；用户可显式 adopt 到 registry。
- 应用前必须有预览、确认、备份或可回滚记录。
- “一键安装”不能绕过用户确认，也不能隐藏写入目标。

### R4. 分析本地实践方式

- 产品应能索引本机全局 skill、MCP、rules、hooks 和相关配置。
- 支持参考 `~/per-pro/my-agent-skill` 的 registry / symlink 管理方式，把本地全局 skill 映射到可被 agent 操纵的仓库。
- 通过本地 Codex / Claude 和分析型 skill，review 当前使用范式是否合理、是否冗余、是否存在更好的替换方案。
- 分析结果应形成具体建议，而不是只显示扫描列表。
- 首版 `Local Review` 聚焦 registry、Claude Code target、Codex target、projection state 和 Practice relation。
- token / cost 用量不是 Local Review 首版主线。

### R5. 方案沉淀和多 agent 同步

- 信息源、卡片、最佳实践、安装记录、分析建议、用户决策都需要持久化到产品 SQLite。
- “多 agent 同步”指统一管理不同 agent 应用 skill、MCP、global rules、hooks 的差异，而不是简单文件复制。
- 需要参考 `/Users/zhici/work-pro/my-agent-skill/install.sh` 梳理 Claude / Codex 等 agent 的安装目标、链接方式和差异。
- MVP 默认优先连接用户已有 registry；没有 registry 时允许从 bundled starter registry 初始化到用户指定路径。
- SQLite 不保存可执行文件资产的唯一副本；它保存资产索引、关系、状态和审计。文件资产由 registry repo 负责版本化。
- SQLite 保存 Signal / Practice 的结构化摘要、metadata、关系、状态和用户决策；不保存完整外部网页、完整 thread dump、完整本地源码 / logs 或 secrets。
- MVP 的真实同步 target 仅包含 Claude Code 和 Codex；其他 target 只做 adapter 预留和 UI 占位。
- 首次启动必须分开授权 registry、本地读取、外部 signals、写入和脚本执行。
- 数据管理能力应允许查看、搜索、归档、删除、重新应用和审计。

### R6. 其他本机配置

- 产品应集中管理辅助 agent 使用的本机脚本，例如 `~/start-codex.sh`、`~/dsleep`、`~/dwake`。
- 这些脚本属于本机 agent 操作环境管理，不应和最佳实践卡片混成同一种对象。
- 脚本以 `Operations Script` 表达，独立于 `Practice Card` 和 `Local Asset`。
- Operations 是独立主视图，不隐藏在 Settings 中。
- UI 应支持查看脚本、运行脚本、查看状态、确认高风险动作，并记录审计。
- 脚本执行权限默认关闭，高风险动作必须在具体执行时确认。

### R7. 原型与信息架构

- 原型必须让“最佳实践闭环”成为第一眼可理解的主线。
- 原型深度为静态高保真 + 关键状态交互，不实现真实数据链路。
- 原型视觉方向是 practice operations console：保留 macOS command deck 气质，弱化装饰感，提高状态、队列、diff、review 和 audit 信息密度。
- 原型必须体现 first-run 分步授权，尤其是 registry、本地读取、外部 signals、写入和脚本执行的边界。
- 第一屏必须是闭环状态总览，而不是 Practice Library 列表。
- Discover / 信息源不应占据全部产品心智；它应服务于 Practice Library、Local Review、Apply & Sync、Operations。
- 主导航不以论坛、热榜或爬取源组织，而以最佳实践对象和闭环阶段组织。
- `Practice Library` 内需要清楚分出 Signals、Practice Cards、Local Assets 三层。
- `Practice Library` 主体验是管道式工作流，底层保留对象库检索、筛选和归档。
- 菜单栏面板应体现每日入口价值：新 Signal / 待整理数量、同步/健康状态、本机 agent 操作状态和安全快捷动作。
- 菜单栏面板可以触发手动刷新，展示新 Signal / 待整理数量，但不能自动整理、安装或写入本地 agent 配置。
- HTML 原型需要包含 `Logo Lab` 区域，集中比较多套 Hone logo 方向，并展示每套方案在 app icon、工作台标题和 MenuBar 面板中的使用效果。

## Acceptance Criteria

- [x] PRD 明确区分”信息源采集”与”最佳实践闭环”的主次关系。
- [x] 与用户完成 grill-me 需求访谈，关键功能边界无开放阻塞项。
- [x] Product Design brief 被用户确认，包含产品目标、视觉来源、原型交互深度。
- [x] 新信息架构明确主视图、菜单栏面板、卡片模型和本地管理对象。
- [x] 后续实现前补齐 `design.md` 和 `implement.md`，覆盖数据模型、SQLite、agent 执行边界、同步 adapter 和验证方式。
- [ ] 后续文档更新能同步修正 `README.md`、`README.en.md`、AGENTS/CLAUDE 项目说明和旧原型偏差。

## Out Of Scope For This Planning Task

- 不在本阶段实现真实爬取、SQLite、同步写入或新 UI。
- 不执行真实安装、真实配置写入或脚本运行。
- 不把产品扩展成服务端 SaaS 或远端工作流平台。

## Resolved Questions

- Q1: 主导航是否应按闭环阶段组织，还是按对象/工作区组织？
  - Answer: 按最佳实践对象 / 闭环组织。信息源采集作为 `Practice Library` 的 intake 能力。
- Q2: 最佳实践卡片和本地可安装资产是否拆成两个对象？
  - Answer: 拆开，并增加第三类 `Operations Script`。`Practice Card` 负责理解和沉淀，`Local Asset` 负责本地应用和同步，`Operations Script` 负责本机 agent 操作环境。
- Q3: `Local Asset` 的真相来源应该放在哪里？
  - Answer: 采用 registry repo + SQLite 双层真相。registry repo 保存文件资产，SQLite 保存 metadata、关系、状态和审计，target 目录只是投射结果。
- Q4: 多 agent 同步第一版只支持 Claude Code / Codex，还是要预留 Cursor / Windsurf / Claude Desktop？
  - Answer: MVP 真实同步只支持 Claude Code + Codex，adapter 和 UI 可以预留其他 target，但不做真实读写。
- Q5: 本机脚本管理是 Settings 下的 Operations 子区，还是独立主视图？
  - Answer: `Operations` 是独立主视图，用于管理本机 agent 运行控制脚本、状态、日志、确认和菜单栏快捷动作。
- Q6: Local Review 首版分析范围是什么？
  - Answer: 首版只分析本地 harness 资产结构，包括 registry、Claude/Codex target、projection drift 和 Practice relation；token/cost 不作为主线。
- Q7: 内置的信息挖掘和最佳实践整理能力应以什么形态存在？
  - Answer: 采用 `System Practice Skill`。默认副本由产品内置，文件资产放 registry repo，SQLite 记录版本、启用状态、执行历史和输出。
- Q8: changelog 和模型讯息在 UI 中应作为独立 Signal，还是并入 Practice Card？
  - Answer: 独立为 `Signal Card`，再允许系统 skill 将其转化或关联到 `Practice Card`。
- Q9: 信息源刷新默认是纯手动、本地定时，还是后台自动？
  - Answer: 默认手动刷新，首次启动不自动联网；用户可显式开启本地每日定时刷新，并按 source 独立开关。
- Q10: MVP 第一屏应该展示闭环状态，还是 Practice Library 列表？
  - Answer: 第一屏展示闭环状态总览，突出 Signals、Practices、Local Assets、Review 和 Operations 的下一步处理入口。
- Q11: Practice Library 内部应采用管道式工作流，还是对象库式工作流？
  - Answer: 主体验采用管道式工作流：Signals -> Practice Cards -> Local Assets -> Apply & Sync -> Review feedback；对象库只做检索和归档能力。
- Q12: Apply & Sync 默认投射方式应该是 symlink 还是 copy？
  - Answer: 默认 symlink，copy 作为 fallback / compatibility mode；必须包含预览、冲突处理、断链检测、回滚、copy drift 检测和审计机制。
- Q13: target 已有未托管资产时，是否允许 adopt 到 registry？
  - Answer: 允许显式 adopt，但默认行为是 skip；adopt 必须逐项确认、备份原始 target 资产、写入 registry 和 SQLite audit。
- Q14: SQLite 是否保存 Signal / Practice Card 正文，还是只保存索引和引用？
  - Answer: 保存结构化摘要、metadata、关系、状态和用户决策；不保存完整网页、完整 changelog 原文、完整 thread dump、完整本地源码 / logs 或 secrets。
- Q15: 模型讯息和产品 changelog 的可信度分层如何表达？
  - Answer: 使用 Official、Maintainer / Repository、Community 三层可信度；模型事实必须有 Official 来源才标记 confirmed。
- Q16: Product Design 原型应做全交互还是静态高保真？
  - Answer: 本轮做静态高保真 + 关键状态交互，覆盖 Home、Practice Library、Apply & Sync、Local Review、Operations 和 MenuBar，但不做真实爬取、SQLite、agent 调用或文件写入。
- Q17: 原型视觉方向是沿用现有 command deck，还是改成更偏资料库 / 控制台的布局？
  - Answer: 保留 command deck 的 macOS 工作台气质，但转成更密集的 practice operations console，突出状态矩阵、管道、diff、review evidence 和 audit。
- Q18: MenuBar 面板应该优先承担每日信号入口，还是本机操作控制入口？
  - Answer: 采用混合入口，但主优先级是待处理闭环状态；展示新 Signal、Practice Health、Operations 状态和安全快捷动作。
- Q19: MVP 是否需要内置一个默认 registry repo，还是只连接用户已有 registry？
  - Answer: 两者都支持。默认优先连接用户已有 registry；产品内置只读 starter registry 作为 fallback / first-run seed，没有 registry 时可初始化到用户指定路径。
- Q20: 首次启动时，本地扫描和外部刷新应该如何授权？
  - Answer: 采用分步授权：registry、本地读取、外部 signals、写入和脚本执行分开授权；写入和高风险脚本动作在具体执行时再次确认。
- Q21: 后续实现是否拆成父任务 + 子任务树？
  - Answer: 拆成父任务 + 5 个子任务：product-prototype、data-model-storage、system-practice-skills、apply-sync-registry、signals-intake。
- Q22: 5 个子任务是否按 product-prototype -> data-model-storage -> system-practice-skills/apply-sync-registry/signals-intake 的顺序推进？
  - Answer: 按 product-prototype -> data-model-storage -> system-practice-skills -> apply-sync-registry -> signals-intake 顺序推进。
- Q23: product-prototype 的交付形态是独立 HTML 原型，还是直接改 React app？
  - Answer: 先做独立 HTML 原型，放在 `docs/product-design/hone-practice-operations-prototype.html`；确认后再进入 React 实现。
- Q24: Product Design 是否进入三方案视觉 ideation？
  - Answer: 进入三方案视觉 ideation，生成 3 个独立视觉方向供选择，选定后再进入 HTML 原型实现。
- Q25: 选择哪个视觉方向作为 HTML 原型 target？
  - Answer: 选择方案 1：`Loop Status Console`。
- Q26: 新 logo 的核心隐喻应采用什么方向？
  - Answer: 不在规划阶段提前收敛到单一隐喻。HTML 原型中提供 `Loop Projection`、`Practice Compass`、`Registry Weave`、`Audit Orbit` 四套方向，用户查看后再选择最终 logo。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
