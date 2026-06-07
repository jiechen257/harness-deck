# Type Safety

## TypeScript Rules

- Use TypeScript for all frontend source.
- Avoid `any`; define explicit union types for `Locale`, `Theme`, `TargetKind`, `RiskLevel`, `OperationType`, and `DataConfidence`.
- Keep IPC payload and response types in `src/lib/types.ts`.
- Components should receive typed props and avoid reaching into untyped blobs.

## Rust / TypeScript Contract

- Frontend types must mirror Rust serde output.
- If backend fields change, update TypeScript types and tests in the same phase.
- Errors from IPC should be normalized before rendering.

## Copy Typing

- Translation keys should be stable.
- Locale objects should satisfy the same key shape.
- Chinese labels use `配置集` for Profiles.

## Validation

Run TypeScript checking before committing:

```bash
pnpm typecheck
```
