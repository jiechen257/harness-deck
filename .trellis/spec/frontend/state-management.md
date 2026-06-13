# 状态管理

## 状态来源

当前使用 React `useState` + 自定义 hook 管理状态。如果复杂度增长（跨组件状态共享、异步状态缓存等），可以引入状态管理库，按需选择。

| 状态 | 类型 | 持久化 | 所在位置 |
|------|------|--------|----------|
| `locale` | `Locale` | `localStorage` | `hooks/useLocale.ts` |
| `theme` | `Theme` | `localStorage` | `hooks/useTheme.ts` |
| `activeView` | `ViewId` | 仅内存 | `App.tsx` |
| `appStatus` | `AppStatus \| null` | 从 `api.ts` 获取 | `App.tsx` |
| `loopSummary` | `LoopSummary \| null` | 从 `api.ts` 获取 | `App.tsx` |
| `signals` | `SignalCard[]` | 从 `api.ts` 获取 | `PracticeLibraryView.tsx` |
| `practices` | `PracticeCard[]` | 从 `api.ts` 获取 | `PracticeLibraryView.tsx` |
| `localAssets` | `LocalAsset[]` | 从 `api.ts` 获取 | `PracticeLibraryView.tsx` / `ApplySyncView.tsx` |
| `projectionPlan` | `ProjectionPlan \| null` | 按需生成 | `ApplySyncView.tsx` |
| `auditEvents` | `AuditEvent[]` | 从 SQLite 获取 | `SettingsView.tsx` / 证据抽屉 |

## Locale 状态

- 默认 `zh-CN`，可切换为 `en-US`。
- 固定 UI 文案在 `constants/copy.ts` 中，按 locale 索引。
- 产品生成的名称（practice 名、target 名、registry path、file path、manifest ID）不翻译。

## Theme 状态

- 默认 `light`，可切换为 `dark`。
- 通过 `data-theme` 属性应用于 app shell 元素。
- CSS 变量在 `styles/app.css` 中通过 `[data-theme="dark"]` 选择器定义。

## 视图状态

- `ViewId` 只能是当前主导航的 6 个值：`home`、`library`、`apply`、`review`、`operations`、`settings`。
- 菜单栏面板用 `localStorage` 的 `hone:open-view` 让主窗口切到指定视图。
- `Cmd+1` 到 `Cmd+6` 对应 6 个主视图，`Cmd+,` 打开 Settings，`Escape` 返回 Home。

## 数据置信度与安全状态

用量、信号、projection health、authorization、ops script 状态必须渲染为可见标签。不要将 fallback、fixture、missing 或未授权数据源显示为权威数据。

## 规则

- 状态方案按复杂度选择：简单场景用 React state + hook，复杂场景可引入状态管理库。
- UI 中始终保持 fallback/fixture 模式可见。
- 所有后端数据通过 `lib/api.ts` 的 typed 封装获取。
- 状态提升到最小必要层级：全局偏好在 Shell 层，业务数据在各视图内部。
