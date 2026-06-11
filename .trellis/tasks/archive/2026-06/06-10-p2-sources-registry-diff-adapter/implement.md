# Implementation Plan

## Checklist

1. 扩展 source tier / confidence 规则和 tests。
2. 实现 registry candidate detection 和 bootstrap commands。
3. Settings / First Run 接入 registry bootstrap。
4. 实现 diff payload service 和 read-only UI。
5. Local Review 接入 drift timeline。
6. 实现 adapter capability service。
7. UI 展示 Claude Code / Codex capabilities 和 unsupported targets。
8. 更新 tests。

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## Risk Points

- 外部 source 当前事实会变化，必须避免把 community 转述当 confirmed。
- Diff 读取必须避免 secrets；默认只读 registry/target assets，不读取任意源码树。
- Registry auto-detect 不能悄悄写入。

## Rollback

- Source refresh failure 只写 failure audit。
- Registry bootstrap 未确认时不创建文件。
- Diff viewer 出错显示无法读取，不阻塞 projection plan。
