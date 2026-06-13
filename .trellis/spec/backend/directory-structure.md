# 后端目录结构

后端代码位于 `src-tauri/src/`。

```text
src-tauri/src/
  lib.rs                         # Tauri builder、tray、invoke_handler 注册
  main.rs
  commands/
    app_commands.rs
    byoa_commands.rs
    db_commands.rs
    insight_commands.rs
    intake_commands.rs
    loop_commands.rs
    projection_commands.rs
    skill_commands.rs
    usage_commands.rs
  db/
    *_repo.rs                    # SQLite table CRUD
    schema.rs                    # migrations
  domain/
    *.rs                         # serde domain structs
  readers/
    claude_reader.rs
    codex_reader.rs
    sanitizer.rs
    skill_scanner.rs
  services/
    app_paths.rs
    byoa_service.rs
    insight_service.rs
    intake_service.rs
    loop_service.rs
    projection_service.rs
    secret_service.rs
    skill_service.rs
    usage_service.rs
  *_tests.rs                     # Rust tests by domain
```

## 模块边界

- `domain/`：可序列化结构体和纯领域类型。
- `db/`：SQLite schema、migration 和 repository 方法。
- `readers/`：本地工具状态读取和敏感路径脱敏。
- `services/`：副作用和业务流程。
- `commands/`：Tauri IPC 边界，保持薄封装。

## 添加新 Tauri 命令

1. 在 `domain/` 定义返回类型。
2. 在 `services/` 实现行为。
3. 在 `commands/` 添加 `#[tauri::command]`。
4. 在 `commands/mod.rs` 暴露模块。
5. 在 `lib.rs` 的 `generate_handler![]` 注册。
6. 在 `src/lib/types.ts` 和 `src/lib/api.ts` 添加前端契约。
7. 添加 Rust 或 React 测试覆盖。
