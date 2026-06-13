# 状态管理

当前使用 React `useState` + 自定义 hook。跨视图缓存复杂化后可以引入专用数据层，但不要提前引入全局状态库。

| 状态 | 类型 | 持久化 | 所在位置 |
|------|------|--------|----------|
| `locale` | `Locale` | `localStorage` | `hooks/useLocale.ts` |
| `theme` | `Theme` | `localStorage` | `hooks/useTheme.ts` |
| `activeView` | `ViewId` | 内存 | `App.tsx` |
| signals/practices/assets | domain arrays | SQLite/Tauri | Discover 视图 |
| usage/insights | domain objects | local readers/Tauri | Usage、Insights 视图 |
| registry/authorization/agents | domain objects | SQLite/Tauri | Settings 视图 |

## 规则

- 全局偏好留在 Shell 层。
- 业务数据尽量在对应 view 内加载。
- 所有后端数据通过 `lib/api.ts` typed 封装获取。
- 浏览器 fallback 用于开发体验，不能作为真实闭环唯一实现。
- 未连接的数据源要显示为 unavailable，不能伪装成真实数据。
