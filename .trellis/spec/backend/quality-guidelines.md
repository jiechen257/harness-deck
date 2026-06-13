# 后端质量规范

## 测试组织

Rust 测试按领域放在 `src-tauri/src/*_tests.rs`：

| 文件 | 覆盖领域 |
|------|----------|
| `db_tests.rs` | SQLite schema、CRUD、authorization、registry、audit |
| `intake_tests.rs` | source config、refresh 授权、信号生成 |
| `loop_tests.rs` | signal -> practice -> local asset、BYOA normalize、registry materialization |
| `projection_tests.rs` | projection plan、confirm、adopt、rollback、health、授权 |
| `skill_tests.rs` | bundled skills、skill config、template substitution |

## 安全约束

- 不硬编码凭据或 token。
- 不把完整 prompt、源代码或完整日志写入错误和 audit。
- 真实 target 写入必须由 `write_projection` 授权保护。
- 文件写入测试使用 temp dir，不碰用户真实 `~/.claude` 或 `~/.codex`。

## 代码风格

- `commands/` 薄封装，复杂逻辑放 `services/`。
- `db/` 只封装持久化，不做 UI 逻辑。
- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]`。
- 后端字段变化必须同步 TypeScript 类型。

## 验证命令

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm lint
pnpm typecheck
pnpm test
```
