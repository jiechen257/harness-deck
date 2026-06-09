# 前端开发规范

HarnessDeck 前端是运行在 Tauri 内的 React + TypeScript 工作台，提供主窗口、菜单栏弹出面板、国际化 UI、主题切换、fixture 工作流视图和 dry-run manifest 预览。

## 规范索引

| 规范 | 说明 | 状态 |
|------|------|------|
| [目录结构](./directory-structure.md) | 分层布局、组件/hooks/constants 拆分 | 已填写 |
| [组件规范](./component-guidelines.md) | 独立文件组件、API 双路径、视觉方向、无障碍 | 已填写 |
| [Hook 规范](./hook-guidelines.md) | 自定义 hook 模式、副作用规则、数据加载 | 已填写 |
| [状态管理](./state-management.md) | locale/theme hook、视图状态、copy 对象、置信度标签 | 已填写 |
| [质量规范](./quality-guidelines.md) | 测试结构、覆盖区域、设计约束、验证命令 | 已填写 |
| [类型安全](./type-safety.md) | 联合类型、Rust-TS serde 契约、no-any 规则、copy 类型 | 已填写 |

## 开发前检查清单

开始前端工作前阅读：

- `CLAUDE.md` — 项目概述、命令、架构、关键约定
- `.trellis/spec/frontend/directory-structure.md` — 分层布局、关键文件
- `.trellis/spec/frontend/component-guidelines.md` — 组件形态和 API 双路径
- `.trellis/spec/frontend/state-management.md` — locale/theme/视图状态
- `.trellis/spec/frontend/quality-guidelines.md` — 测试覆盖和设计约束

## 产品 UI 规则

- 默认语言为简体中文（`zh-CN`），英文切换必须可用。
- 默认主题为浅色，深色切换必须可用。
- 中文 UI 中 Profiles 使用「配置集」。
- 视觉语言为克制的工程美学，非营销风格。
- 不使用星宿名（天枢、天璇、瑶光）作为功能名称。
- 产品生成的名称（配置集名、目标名、文件路径、manifest ID）不翻译。
