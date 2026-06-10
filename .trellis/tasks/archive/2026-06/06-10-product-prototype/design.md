# Hone 产品原型设计

## Scope

本子任务交付独立 HTML 原型：`docs/product-design/hone-practice-operations-prototype.html`。原型用于验证 Hone 的新定位、信息架构、关键状态和 logo 方向，不修改 React / Tauri 应用代码，不实现真实 SQLite、agent 调用、网络采集或文件写入。

## Visual Direction

采用 `Loop Status Console`，但视觉风格必须对齐用户提供的冷白 macOS 工具台参考图：白色和极浅灰为主背景，蓝色作为主选中和信息源强调，青绿、紫、金作为 Practices、Review、Operations 的状态色。避免暖金米色 command deck 风格，减少装饰背景，把视觉重心放在闭环状态、处理队列、投射 diff、review evidence 和 audit。

参考图中的左侧是 macOS MenuBar panel 表面，右侧是完整 Workbench 表面。两者是同一个产品的两个窗口 / 面板形态，不是一个工作台内的 sidebar + content。原型必须保持这个边界：

- MenuBar panel：今日健康度、Practice Health、Operations、Quick Actions、Profile/Sync footer。
- Workbench：顶部主导航、搜索/通知/account、Local Only context strip、闭环状态卡片、右侧 Next Decisions / Targets / Audit rail、底部本地数据库和审计状态。

主屏结构：

```text
Prototype shell
  -> MenuBar panel preview
  -> Main workbench
     -> Top navigation / search / account
     -> Home
     -> Practice Library
     -> Practice Detail
     -> Apply & Sync
     -> Local Review
     -> Operations
     -> Settings / First Run
     -> Logo Lab
```

Workbench 顶部导航必须按闭环对象组织：`Home`、`Practice Library`、`Apply & Sync`、`Local Review`、`Operations`、`Settings`。`Logo Lab` 作为原型内的设计评审区入口，不进入正式产品主导航。

## Logo Lab

原型内置 4 套 logo 方向，全部使用 inline SVG / CSS 绘制，避免依赖外部图片资产。

- `Loop Projection`：闭环轨道包裹 registry 源点，投射到 Claude / Codex 两个目标节点。
- `Practice Compass`：方向环、实践检查点和 review 刻度，表达持续校准。
- `Registry Weave`：repo / branch / symlink 线束，表达本地 registry 对多 agent target 的统一投射。
- `Audit Orbit`：闭环、盾牌检查点和回滚刻度，表达安全确认和可追溯。

每套 logo 都要展示三个预览：

- app icon：小尺寸方形 / 圆角图标效果。
- workbench title：工作台标题栏品牌位。
- MenuBar panel：紧凑面板中的品牌标识。

Logo Lab 的选择按钮只更新原型中的视觉预览状态，不持久化、不替换真实产品代码。

## Screen Contracts

### Home

第一屏展示闭环状态，而不是信息列表：

```text
Signals -> Practices -> Local Assets -> Review -> Operations
```

每个状态块需要显示当前数量、健康状态、下一步动作和最近 audit 线索。

### Practice Library

主体验为管道：

```text
Signals | Practices | Assets | Archived
```

Signal 可以打开 normalize preview，Practice Card detail 展示介绍、应用场景、同类方案、来源可信度和是否可生成 Local Asset。

### Apply & Sync

展示 registry -> Claude Code / Codex target 的 projection graph。默认 symlink，copy 作为 fallback 状态。必须能看到 conflict、adopt、backup、rollback、audit trail 的关系。

### Local Review

展示 registry、Claude target、Codex target、projection state 和 Practice relation 的 review evidence。建议类型包括 drift、orphan、missing、redundant、replacement。

### Operations

展示 `~/start-codex.sh`、`~/dsleep`、`~/dwake` 这类本机 agent 操作脚本的状态、风险等级、最近执行、确认入口和 audit。

### MenuBar Panel

面板优先展示今日闭环状态：new signals、pending practices、sync health、operations state 和安全快捷入口。它不能展示长资讯列表，也不能自动 normalize / install / write。

### First Run

用分步授权展示：registry、local read、external signals、write projection、script execution。每步要表达默认关闭或需要明确授权的边界。

## Interaction Model

用少量本地 JavaScript 支撑关键状态：

- 主视图切换。
- Practice pipeline tab / item selection。
- Signal -> Practice preview 展开。
- Apply & Sync projection plan / conflict / adopt 状态切换。
- MenuBar panel 状态展示。
- Logo Lab 切换当前预览 logo。
- Light / dark theme 切换可选实现，默认浅色。

所有交互只修改 DOM 状态，不调用外部接口。

## Content Model

原型数据写在 HTML 内部的静态对象中，包含：

- signals：官方 changelog、模型讯息、社区实践发现。
- practices：Product、Skill、MCP、Workflow、Methodology。
- assets：Skill、MCP config、Rule、Hook、Agent profile fragment。
- targets：Claude Code、Codex。
- operations scripts：`start-codex.sh`、`dsleep`、`dwake`。
- audit entries：refresh、normalize、projection preview、adopt、rollback。

内容必须使用示例数据，不使用真实个人日志、secrets、完整源码或完整外部文章。

## Constraints

- 单文件 HTML，方便直接打开和评审。
- 不引入构建步骤。
- 不依赖真实后端、Tauri command、SQLite、Codex / Claude 执行或网络请求。
- 图标和 logo 使用内联 SVG / CSS，避免远端依赖影响评审。
- 文案默认中文，可在关键标签上保留英文对象名。
- 页面必须在桌面宽屏和窄屏下保持不重叠、不溢出。
