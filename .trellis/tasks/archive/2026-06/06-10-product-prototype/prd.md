# Hone 产品原型：practice operations console

## Goal

产出一版静态高保真 + 关键状态交互的产品原型，验证 Hone 从 crawler-heavy 体验转向“本地 harness practice 运营台”的定位。

## Requirements

- 原型第一屏必须是 `Home` 闭环状态总览，而不是 Practice Library 列表。
- 原型先交付为独立 HTML 文件：`docs/product-design/hone-practice-operations-prototype.html`。
- 本任务不直接修改现有 React app；用户确认原型后再进入 React 实现。
- 原型视觉目标选择三方案 ideation 中的方案 1：`Loop Status Console`。
- 视觉风格必须对齐用户提供的冷白 macOS 工具台参考图：白底、浅灰分隔、蓝色主强调、青绿/紫/金作为状态色，避免暖金米色 command deck 风格。
- 原型中的左侧表面是 macOS MenuBar panel，不是主工作台侧边栏；右侧表面才是完整 Workbench。
- 主导航使用：`Home`、`Practice Library`、`Apply & Sync`、`Local Review`、`Operations`、`Settings`。
- 视觉方向为 `practice operations console`：保留 macOS command deck 气质，弱化装饰感，提高状态、队列、diff、review evidence 和 audit 信息密度。
- `Practice Library` 必须体现管道式工作流：`Signals -> Practices -> Assets -> Archived`。
- 原型必须覆盖 Home、Practice Library、Practice Card detail、Apply & Sync、Local Review、Operations、MenuBar 和 first-run 分步授权。
- 关键交互至少包括主视图切换、Signal 转 Practice preview、Asset 投射预览和冲突状态、MenuBar 状态展示。
- 产品 logo 需要结合新定位重新设计，不沿用 fader / Command 图标语义。
- 原型需要内置 `Logo Lab`，提供至少 4 套 logo 方向供后续选择：`Loop Projection`、`Practice Compass`、`Registry Weave`、`Audit Orbit`。
- 每套 logo 都需要能表达持续闭环、本地优先、安全投射和 harness practice 运营台。
- 每套 logo 都需要在 app icon、工作台标题和 MenuBar panel 三个场景中展示预览。

## Acceptance Criteria

- [x] 原型不呈现为资讯流、爬虫平台或普通卡片收藏夹。
- [x] Home 第一屏能清楚表达 Signals、Practices、Local Assets、Review、Operations 的闭环状态和下一步入口。
- [x] Practice Library 的管道状态清晰可见。
- [x] Apply & Sync 的 symlink / adopt / conflict / audit 关系清晰可见。
- [x] MenuBar 面板不展示长资讯列表，不执行高风险动作，只提供状态和安全快捷入口。
- [x] 左侧 MenuBar panel 与右侧 Workbench 的产品表面边界清晰，不把 MenuBar panel 误做成工作台 sidebar。
- [x] 原型颜色、间距、卡片密度和状态色对齐用户提供的冷白蓝色参考图。
- [x] 原型不实现真实爬取、SQLite、agent 调用或文件写入。
- [x] 原型作为独立 HTML 文件交付，不修改现有 React app。
- [x] 原型包含 `Logo Lab`，至少展示 4 套 Hone logo 方向。
- [x] 每套 logo 都展示 app icon、工作台标题和 MenuBar panel 预览，便于用户后续选择。

## Dependencies

- 父任务：`.trellis/tasks/06-10-hone-positioning-practice-loop/prd.md`。

## Notes

- 实现前需要补 `design.md` 和 `implement.md`。
