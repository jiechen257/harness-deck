# P0 Apply Sync 真实确认流

## Goal

把 Apply & Sync 从“展示 projection 概念”推进到真实可操作的安全投射闭环：

```text
Local Asset ready
  -> Projection plan
  -> Confirm symlink projection
  -> Conflict skip / adopt
  -> Rollback
  -> Audit
  -> Local Review reflects state
```

## Requirements

- Apply & Sync 的 plan 必须来自 Rust `preview_projection`。
- 用户可以选择 target：Claude Code、Codex。
- Projection plan 必须展示 create / update / skip / conflict、source、target、mode、conflict reason。
- 默认 symlink；copy 只作为 fallback / compatibility mode。
- 普通文件或目录冲突默认 skip，不覆盖。
- Confirm projection 必须调用 Rust `confirm_projection`，并显示执行结果。
- Adopt 必须逐项确认，展示 target path、registry destination、backup path、target kind 和风险。
- Rollback 必须可从 audit/projection record 发起，并明确“只删除 target link，不删除 registry 源文件”。
- 所有 projection/adopt/rollback 写 audit。
- Local Review 必须能看到投射后的 broken symlink / missing projection / conflict 状态。

## Acceptance Criteria

- [ ] 用户能在 Apply & Sync 选择 Claude Code 或 Codex target。
- [ ] Plan tab 显示真实 projection plan 和 summary counts。
- [ ] Conflict tab 显示未托管 target asset，并提供 `Skip` 和 `Adopt` 入口。
- [ ] Confirm projection 前有明确确认按钮和影响范围。
- [ ] Confirm projection 成功后，target symlink 创建，SQLite projection active，audit 写入。
- [ ] Adopt 前展示 source、registry dest、backup path；确认后复制进 registry、备份原 target、创建 symlink、写 Local Asset / Projection / Audit。
- [ ] Rollback 成功后删除 target symlink，registry 源文件保留，projection status removed，audit 写入。
- [ ] 操作失败时显示错误，不丢失用户当前 plan。
- [ ] 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`cargo test --manifest-path src-tauri/Cargo.toml`。

## Out Of Scope

- Cursor/Windsurf/Claude Desktop 真实写入。
- P2 diff viewer 的完整 side-by-side 编辑体验。
