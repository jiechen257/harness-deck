# 日志规范

HarnessDeck 日志遵循本地优先和隐私保护原则。

## 配置

日志使用 `tauri-plugin-log`，仅在 debug 构建中启用：

```rust
// src-tauri/src/lib.rs
if cfg!(debug_assertions) {
    app.handle().plugin(
        tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
    )?;
}
```

不配置远程遥测。

## 应该记录

- 应用启动和版本
- 应用数据路径初始化（`app_paths::paths_for_app`）
- Fixture 配置集加载
- Fixture 目标加载
- Deploy plan 生成
- Dry-run manifest 创建
- 未来阶段中的显式隐私或真实写入确认事件

## 不应记录

- Prompt 内容
- 源代码
- API key、token、bearer 字符串、私钥
- 完整用户配置文件
- 从其他工具导入的完整本地日志

## 审计记录

审计记录是产品级记录，不是调试日志。它们建模为 domain 结构体：

```rust
// src-tauri/src/domain/account_workspace.rs
pub struct AuditEntry {
    pub id: String,
    pub created_at: String,
    pub summary: String,
    pub severity: String,   // "info" | "warn" | "error"
}
```

未来的真实写入、账号切换、回滚操作、隐私授权和 Keychain 访问必须产生带安全元数据的审计事件——不含原始秘密值。
