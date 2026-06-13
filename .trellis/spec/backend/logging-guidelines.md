# 日志规范

Hone 日志遵循本地优先和隐私保护原则。

## 配置

日志使用 `tauri-plugin-log`，仅在 debug 构建中启用：

```rust
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
- 应用数据路径初始化
- SQLite 初始化和 seed 结果
- signal refresh / normalize 的摘要计数
- Practice Card 和 local asset 状态变化
- projection preview / confirm / adopt / rollback 的摘要和 target ID
- ops script 预览与确认结果
- 显式授权、撤销授权、registry 初始化和 audit 写入

## 不应记录

- Prompt 内容
- 源代码
- API key、token、bearer 字符串、私钥
- 完整用户配置文件
- 从其他工具导入的完整本地日志

## 审计记录

审计记录是产品级记录，不是调试日志。它们建模为 domain 结构体：

```rust
pub struct AuditEvent {
    pub id: String,
    pub event_type: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub detail: Option<String>,
    pub outcome: String,
    pub created_at: String,
}
```

真实写入、rollback、adopt、隐私授权、script execution 确认和 registry 初始化必须产生带安全元数据的审计事件，不含原始秘密值、完整 prompt、完整日志或源代码内容。
