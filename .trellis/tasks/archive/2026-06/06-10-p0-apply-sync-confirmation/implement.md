# Implementation Plan

## Checklist

1. 阅读 backend projection tests 和 service。
2. 补齐 target adapter path discovery。
3. 补齐 projection command result payload 和 error mapping。
4. 改造 `ApplySyncView`：
   - target selector
   - real plan load
   - confirm flow
   - conflict/adopt flow
   - rollback/audit flow
5. 更新 `LocalReviewView` 对 projection health 的展示。
6. 增加 React tests 和 Rust tests。
7. 运行验证。

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## Risk Points

- 文件系统写入必须只发生在用户确认后。
- Adopt 失败不能删除原始 target asset。
- Rollback 不能删除非 symlink target。
- 当前工作区已有 UI polish，改造时不能回退。

## Rollback

- 保留 plan-only UI 路径。
- 出现执行错误时保留 projection plan 和 audit error。
