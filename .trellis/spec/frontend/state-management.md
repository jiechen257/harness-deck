# 状态管理

## 状态来源

当前使用 React `useState` + 自定义 hook 管理状态。如果复杂度增长（跨组件状态共享、异步状态缓存等），可以引入状态管理库（如 Zustand、Jotai、TanStack Query 等），按需选择。

| 状态 | 类型 | 持久化 | 所在位置 |
|------|------|--------|----------|
| `locale` | `Locale` | `localStorage` | `hooks/useLocale.ts` |
| `theme` | `Theme` | `localStorage` | `hooks/useTheme.ts` |
| `activeView` | `ViewId` | 仅内存 | `Workbench.tsx` |
| `profiles` | `ProfileSummary[]` | 从 `api.ts` 获取 | 视图组件 |
| `targets` | `TargetSummary[]` | 从 `api.ts` 获取 | 视图组件 |
| `deployPlan` | `DeployPlan \| null` | 按需生成 | `SyncView.tsx` |
| `manifest` | `ManifestSummary \| null` | dry-run 确认后写入 | `SyncView.tsx` |

## Locale 状态

- 默认 `zh-CN`，可切换为 `en-US`。
- 所有固定 UI 文案在 `constants/copy.ts` 中，按 locale 索引：

```tsx
// src/constants/copy.ts
export const copy = {
  "zh-CN": {
    title: "HarnessDeck 命令中心",
    currentProfile: "当前配置集",
    // ...
  },
  "en-US": {
    title: "HarnessDeck Command Center",
    currentProfile: "Current Profile",
    // ...
  },
} satisfies Record<Locale, Record<string, string>>;

export type CopyStrings = (typeof copy)["zh-CN"];
```

- 产品生成的名称（配置集名、目标名、文件路径、manifest ID）不翻译。

## Theme 状态

- 默认 `light`，可切换为 `dark`。
- 通过 `data-theme` 属性应用于 app shell 元素：

```tsx
<div data-theme={theme} data-testid="app-shell">
```

- CSS 变量在 `styles/app.css` 中通过 `[data-theme="dark"]` 选择器定义。

## 数据置信度标签

用量指标携带 `DataConfidence` 字段（`Official`、`LocalLog`、`Estimated`、`Missing`），必须渲染为可见标签。不要将未连接的数据源显示为权威数据。

## 规则

- 状态方案按复杂度选择：简单场景用 React state + hook，复杂场景可引入状态管理库。
- UI 中始终保持 fixture 模式可见。
- 所有后端数据通过 `lib/api.ts` 的 typed 封装获取。
- 状态提升到最小必要层级：全局偏好在 Shell 层，业务数据在各视图内部。
