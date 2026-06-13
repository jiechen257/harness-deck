# 前端质量规范

## 测试结构

使用 `@testing-library/react` + `vitest` + `jsdom`。`App.test.tsx` 覆盖 Shell 级集成流程。

## 覆盖要求

| 区域 | 验证内容 |
|------|----------|
| Locale | 默认 zh-CN，英文切换可用 |
| Theme | 默认 light，dark 切换可用 |
| 导航 | Home、Discover、Usage、Insights、Settings；Cmd+1-5；Cmd+,；Escape |
| Discover | signal -> practice preview -> Practice Card -> local asset |
| Usage | 可进入并展示用量/成本空态或真实数据 |
| Insights | 可进入并展示洞察、投射健康度、audit trail |
| Settings | registry、authorization、BYOA agent detection |
| Projection | 从 asset 进入 plan；写入动作由 Rust 授权测试覆盖 |
| MenuBar | `?panel=1` 渲染独立面板，展示健康度、实践状态、本地用量、快捷入口 |

## 设计约束

- 主窗口只有五个主导航视图。
- Projection plan 是详情入口，不在主导航。
- 菜单栏面板展示闭环健康度、实践健康度、本地用量和快捷动作。
- 原生体感：系统字体、默认光标、平台 focus ring、WebKit 右键菜单抑制。
- 文本不能溢出或遮挡相邻内容。

## 验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
```
