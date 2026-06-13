# 类型安全

## TypeScript 规则

- 所有前端源码使用 TypeScript。
- `@typescript-eslint/no-explicit-any` 为 `error`。
- 领域枚举使用显式联合类型。

```tsx
export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type AuthScope =
  | "registry"
  | "local_read"
  | "external_signals"
  | "write_projection"
  | "script_execution";
```

```tsx
export type ViewId = "home" | "discover" | "usage" | "insights" | "settings" | "apply";
export type NavViewId = Exclude<ViewId, "apply">;
```

## Rust / TypeScript 契约

所有 Rust domain 结构体使用 `#[serde(rename_all = "camelCase")]`。TypeScript 接口必须精确镜像 camelCase 字段名。

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalAsset {
    pub registry_path: String,
}
```

```tsx
export interface LocalAsset {
  registryPath: string;
}
```

后端字段变更时，同一次改动更新 TypeScript 类型、API wrapper 和测试。
