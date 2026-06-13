# 日志规范

Hone 日志遵循本地优先和隐私保护原则。

## Debug Log

`tauri-plugin-log` 仅在 debug 构建中启用，不配置远程遥测。

可记录：

- 应用启动和版本。
- 应用数据路径初始化。
- 本地 source refresh 摘要。
- projection plan / confirm / rollback 的安全摘要。
- BYOA agent 检测状态。

不可记录：

- Prompt 内容。
- 源代码。
- API key、token、bearer 字符串、私钥。
- 完整用户配置文件。
- 完整本地日志。

## Audit

Audit 是产品级记录，写入 SQLite `audit_events`。授权、signal refresh、practice 创建、local asset 创建、projection confirm/adopt/rollback 都应产生 audit。

Audit detail 只保存安全摘要，不保存秘密值。
