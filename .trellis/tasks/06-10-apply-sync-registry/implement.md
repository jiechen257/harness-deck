# Hone Apply & Sync Registry 执行计划

## Implementation Checklist

1. 创建 `domain/projection_plan.rs`：ProjectionAction、ActionType、ProjectionMode、ProjectionPlan、HealthFinding。
2. 创建 `services/projection_service.rs`：
   - `plan_projection()` — 扫描 registry assets + 对比 target → 生成 plan
   - `execute_projection()` — confirmed 后逐项创建 symlink/copy，写 DB
   - `adopt_unmanaged()` — copy 到 registry → backup → symlink → 写 DB
   - `rollback_projection()` — 删除 target link → 更新 status
   - `check_health()` — broken symlink + copy drift 检测
3. 创建 `commands/projection_commands.rs`：
   - `preview_projection` / `confirm_projection` / `adopt_asset` / `rollback_projection` / `check_projection_health`
4. 在 `lib.rs` 注册 projection commands。
5. 在 `api.ts` / `types.ts` 添加前端类型和 API。
6. 编写测试（使用 tempdir 模拟 registry 和 target）：
   - plan 生成正确性
   - symlink 创建和验证
   - conflict 检测（target 已有文件时 skip）
   - adopt flow
   - rollback 不删 registry 源
   - broken symlink 检测
   - audit 写入
7. 运行 `cargo test` 和 `pnpm typecheck`。

## Validation

```bash
cargo test --manifest-path src-tauri/Cargo.toml -- projection
pnpm typecheck
```

## Risk Points

- macOS 上 symlink 需要正确处理相对 vs 绝对路径，首版用绝对路径
- `fs::symlink` 在不同 OS 有差异，macOS 用 `std::os::unix::fs::symlink`
- 并发投射可能产生竞争，首版通过 Mutex<Database> 串行化

## Rollback

新增文件删除即可。不修改现有 target_adapter。
