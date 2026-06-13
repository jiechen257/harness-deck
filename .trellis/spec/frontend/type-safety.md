# 类型安全

## TypeScript 规则

- 所有前端源码使用 TypeScript。
- `@typescript-eslint/no-explicit-any` 设为 `error`，禁止 `any`。
- 使用显式联合类型定义领域枚举：

```tsx
export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "claude_code" | "codex";
export type AuthScope = "registry" | "local_read" | "external_signals" | "write_projection" | "script_execution";
export type SignalImpact = "low" | "medium" | "high";
export type ProjectionStatus = "planned" | "active" | "rolled_back" | "failed";
```

```tsx
// src/constants/types.ts
export type ViewId = "home" | "library" | "apply" | "review" | "operations" | "settings";

export interface NavItem {
  id: ViewId;
  icon: React.ComponentType;
  zh: string;
  en: string;
}
```

## Rust / TypeScript 契约

所有 Rust domain 结构体使用 `#[serde(rename_all = "camelCase")]`。TypeScript 接口必须精确镜像 camelCase 字段名：

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PracticeCard {
    pub id: String,
    pub practice_type: String,   // 序列化为 "practiceType"
}
```

```tsx
export interface PracticeCard {
  id: string;
  practiceType: string;          // 匹配 camelCase serde 输出
}
```

后端字段变更时，必须在同一次提交中更新 TypeScript 类型和测试。

## Copy 类型

`copy` 对象使用 `satisfies Record<Locale, Record<string, string>>` 确保两种语言有相同的 key。

组件通过 `CopyStrings` 类型接收 copy 对象，而不是通用的 `Record<string, string>`。

## 验证

```bash
pnpm typecheck
pnpm lint
```
