# Technical Design

## Backend

现有 `projection_service` 已实现：

- `plan_projection`
- `execute_projection`
- `rollback_projection`
- `adopt_unmanaged`
- `check_health`

本任务主要补强：

- command 参数校验和错误语义。
- projection/adopt 执行结果 payload。
- target adapter discovery，用于 Claude Code / Codex 的 target path 建议。
- audit detail 结构化 JSON。
- copy fallback / drift 结果的表达。

## Frontend

`ApplySyncView` 改为真实交互：

- Target selector：Claude Code / Codex。
- Plan panel：projection action list + summary。
- Confirmation panel：用户确认执行。
- Conflict panel：逐项 conflict card。
- Adopt flow：表单或抽屉，展示 registry destination、backup path、asset type。
- Audit panel：最近 projection/adopt/rollback audit。

## Contracts

新增/补齐 TS 类型：

```text
ProjectionTarget
ProjectionExecutionResult
AdoptPreview
AdoptRequest
RollbackRequest
```

Rust serde 使用 camelCase。

## Safety

- Confirm projection 只执行 `Create` / `Update` action。
- Conflict action 不执行。
- Update 只能替换已有 symlink，不能删除普通文件/目录。
- Adopt 需要 explicit user confirmation。
- Rollback 检查 target 是否 symlink；如果不是 symlink，拒绝删除。
