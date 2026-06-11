# Technical Design

## Sources

扩展 source config 和 signal confidence 规则：

```text
Official -> confirmed allowed for model/product facts
Maintainer/Repository -> repository fact / practice discovery
Community -> unverified / community-reported only
```

官方 source 实现可以先覆盖可稳定读取的本地/公开 endpoint；如果外部访问失败，写 refresh failure audit，不生成虚假 confirmed signal。

## Registry Bootstrap

新增 service：

```text
detect_registry_candidates()
initialize_registry(path)
use_starter_registry_readonly()
```

候选优先级：

1. 用户已保存 active registry。
2. 常见本机路径，例如 `/Users/zhici/work-pro/my-agent-skill`。
3. `~/HoneRegistry`。
4. bundled starter registry。

## Diff Viewer

Rust 提供 read-only diff payload：

```text
sourcePath
targetPath
sourceExists
targetExists
sourceText
targetText
diffHunks
readError
```

前端只展示，不直接编辑。

## Drift Timeline

基于 audit/projection records 聚合：

- last projected
- first drift detected
- last health check
- related adopt/rollback

## Adapter Status

Target adapter capability：

```text
detect
readConfig
previewProjection
writeProjection
rollback
healthCheck
```

Claude Code 和 Codex 显示真实结果，其他 target 显示 unsupported。
