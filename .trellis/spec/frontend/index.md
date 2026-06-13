# 前端开发规范

Hone 前端是运行在 Tauri 内的 React + TypeScript 工作台，提供主窗口、菜单栏弹出面板、五视图闭环、国际化 UI、主题切换和本地优先交互。

## 规范索引

| 规范 | 说明 |
|------|------|
| [目录结构](./directory-structure.md) | App shell、views、menubar、hooks、constants、lib 分层 |
| [组件规范](./component-guidelines.md) | 独立文件组件、typed props、API 双路径、无障碍 |
| [Hook 规范](./hook-guidelines.md) | 自定义 hook、副作用规则、数据加载 |
| [状态管理](./state-management.md) | locale/theme/activeView、业务数据位置 |
| [质量规范](./quality-guidelines.md) | 测试覆盖、设计约束、验证命令 |
| [类型安全](./type-safety.md) | 联合类型、Rust-TS serde 契约、no-any 规则 |

## 产品 UI 规则

- 默认语言为简体中文（`zh-CN`），英文切换必须可用。
- 默认主题为浅色，深色切换必须可用。
- 主导航固定为 Home、Discover、Usage、Insights、Settings。
- Projection plan 是从 Discover local asset 流程进入的详情面，不是主导航。
- 视觉语言为克制的本地开发者工具，避免营销式落地页。
- 不使用星宿名作为功能名称。
- 产品生成的名称、target 名称、文件路径、audit ID 不翻译。
