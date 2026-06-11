# Technical Design

## UX Structure

### Loop Stepper

统一小型 stepper：

```text
Signal -> Practice -> Asset -> Projection -> Review
```

用于 Practice Library 详情、Apply & Sync、Local Review evidence。

### Detail Panel

每类对象复用一套详情容器：

- header：title、type/status、source tier/confidence。
- body：summary、paths、related objects。
- footer：next action、audit links。

### Recoverable Error

前端 API 层提供统一映射：

```text
code
message
actionLabel
actionTarget
diagnostics
```

### MenuBar

MenuBar 从 `get_loop_summary` 获取：

- signal counts
- pending practice counts
- asset projection status
- review findings
- operations status
- latest audit

按钮：

- Refresh Signals：只在已授权 external_signals 时执行，否则打开 Settings。
- Open Local Review：打开主窗口并切 view。
- Open Apply & Sync：打开主窗口并切 view。

## Operations

Operations scripts 继续作为只读/preview-first 能力。真实执行需要：

- script authorization
- preview result
- confirm button
- audit record

若当前后端缺少真实 script command，本任务可先实现 preview/blocked 状态和 UI 恢复，不伪装执行成功。
