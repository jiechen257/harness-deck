# Hook 规范

## 自定义 Hooks

将含副作用或可复用的状态逻辑抽取为独立 hook 文件，放在 `src/hooks/` 下。

### useLocale

管理语言状态，自动同步到 localStorage：

```tsx
// src/hooks/useLocale.ts
import { useEffect, useState } from "react";
import type { Locale } from "../lib/types";

const STORAGE_KEY = "harnessdeck-locale";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en-US" ? "en-US" : "zh-CN";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return [locale, setLocale] as const;
}
```

### useTheme

管理主题状态，同样模式：

```tsx
// src/hooks/useTheme.ts
import { useEffect, useState } from "react";
import type { Theme } from "../lib/types";

const STORAGE_KEY = "harnessdeck-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
```

## 偏好默认值

| 偏好 | 默认 | Storage key |
|------|------|-------------|
| Locale | `zh-CN` | `harnessdeck-locale` |
| Theme | `light` | `harnessdeck-theme` |

两者通过 `localStorage` 在页面刷新后保持。

## 副作用规则

- `localStorage` 读写封装在 hook 内部，组件不直接操作 `localStorage`。
- Tauri IPC 调用保持在 `lib/api.ts`，组件通过 typed API 函数调用，不直接使用 `invoke()`。
- 前端代码不读取真实用户配置文件。

## 数据加载模式

视图组件在挂载时从 `lib/api.ts` 加载数据：

```tsx
// 视图组件中的典型数据加载
const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
useEffect(() => {
  listProfiles().then(setProfiles);
}, []);
```

如果多个视图共享相同的数据加载逻辑，可以提取为专用 hook（如 `useProfiles`），但不强制要求——简单的 `useState` + `useEffect` 组合在视图内部使用即可。

## 什么时候提取 hook

| 场景 | 做法 |
|------|------|
| 副作用 + 状态持久化（locale、theme） | 建议提取为自定义 hook |
| 多个组件共享完全相同的加载逻辑 | 建议提取 |
| 单个视图内的简单数据加载 | 保持内联 |

## 测试

Hook 通过组件测试覆盖——在测试中渲染使用 hook 的组件，验证行为。也可以使用 `@testing-library/react` 的 `renderHook` 单独测试复杂 hook。
