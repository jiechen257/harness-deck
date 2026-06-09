# Type Safety

## TypeScript Rules

- Use TypeScript for all frontend source.
- `@typescript-eslint/no-explicit-any` is set to `error` — no `any` allowed.
- Define explicit union types for domain enums:

```tsx
// src/lib/types.ts
export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "Codex" | "ClaudeCode";
export type OperationType = "CreateFile" | "UpdateFile" | "AppendBlock" | "ReplaceBlock" | "Noop";
export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";
export type DataConfidence = "Official" | "LocalLog" | "Estimated" | "Missing";
export type WakeMode = "StandardAwake" | "TimedAwake" | "DisplaySleep" | "ExperimentalLidAwake";
```

## Rust / TypeScript Contract

All Rust domain structs use `#[serde(rename_all = "camelCase")]`. TypeScript interfaces must mirror the camelCase field names exactly:

```rust
// Rust side
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileSummary {
    pub id: String,
    pub mcp_references: usize,   // serializes as "mcpReferences"
}
```

```tsx
// TypeScript side
export interface ProfileSummary {
  id: string;
  mcpReferences: number;         // matches camelCase serde output
}
```

If backend fields change, update TypeScript types and tests in the same commit.

## Copy Typing

The `copy` object uses `satisfies Record<Locale, Record<string, string>>` to enforce that both locales have the same keys:

```tsx
const copy = {
  "zh-CN": { title: "HarnessDeck 命令中心", /* ... */ },
  "en-US": { title: "HarnessDeck Command Center", /* ... */ },
} satisfies Record<Locale, Record<string, string>>;
```

## Validation

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint with no-explicit-any = error
```
