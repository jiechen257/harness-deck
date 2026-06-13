# 前端开发规范

Hone 前端是运行在 Tauri 内的 React + TypeScript 工作台，提供主窗口、菜单栏弹出面板、国际化 UI、主题切换，以及 Practice Shard 6 视图产品闭环。

当前 UI 权威参考是 `docs/product-design/screens/workbench-home.html` 和 `docs/product-design/screens/statusbar-panel.html`。README 是产品说明，不覆盖设计稿中的 6 视图结构。

## 规范索引

| 规范 | 说明 | 状态 |
|------|------|------|
| [目录结构](./directory-structure.md) | 当前 `src/` 文件布局、主视图、遗留视图边界 | 已填写 |
| [组件规范](./component-guidelines.md) | 组件分层、typed props、API 边界、视觉方向 | 已填写 |
| [Hook 规范](./hook-guidelines.md) | 自定义 hook 模式、副作用规则、数据加载 | 已填写 |
| [状态管理](./state-management.md) | locale/theme、activeView、loop summary、业务数据 | 已填写 |
| [质量规范](./quality-guidelines.md) | 测试结构、覆盖区域、设计约束、验证命令 | 已填写 |
| [类型安全](./type-safety.md) | 联合类型、Rust-TS serde 契约、no-any 规则 | 已填写 |

## 开发前检查清单

开始前端工作前阅读：

- `CLAUDE.md` — 项目概述、命令、架构、关键约定
- `.trellis/spec/frontend/directory-structure.md` — 分层布局、关键文件
- `.trellis/spec/frontend/component-guidelines.md` — 组件形态和 API 边界
- `.trellis/spec/frontend/state-management.md` — locale/theme/视图状态
- `.trellis/spec/frontend/quality-guidelines.md` — 测试覆盖和设计约束

## 产品 UI 规则

- 默认语言为简体中文（`zh-CN`），英文切换必须可用。
- 默认主题为浅色，深色切换必须可用。
- 当前主导航固定为 6 个视图：`home`、`library`、`apply`、`review`、`operations`、`settings`。
- `UsageView`、`InsightsView`、`DiscoverView` 文件属于遗留或未来能力，不作为当前主导航入口。
- 视觉语言遵循 Practice Shard 工作台：左侧闭环导航、中央信号/操作画布、右侧证据抽屉。
- 不使用星宿名（天枢、天璇、瑶光）作为功能名称。
- 产品生成的名称（practice 名、target 名、registry path、file path、manifest ID）不翻译。
