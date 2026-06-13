# 后端质量规范

## 测试组织

测试按领域域组织在 `src-tauri/src/tests/` 目录下，每个文件对应一个领域区域：

| 文件 | 覆盖领域 |
|------|----------|
| `profile_tests.rs` | 配置集解析和验证、缺失字段拒绝、秘密扫描 |
| `deploy_tests.rs` | deploy plan 生成（含 dry-run 标记）、manifest 写入和读取 |
| `target_tests.rs` | 目标发现需要显式授权、授权后返回安全摘要 |
| `sync_governance_tests.rs` | 三方 diff、冲突队列、漂移检测、回滚预览 |
| `account_tests.rs` | 账号工作区 Keychain 引用、模型切换预览 |
| `usage_tests.rs` | 用量汇总、置信度标签 |
| `registry_tests.rs` | 注册表模板列表、find-best-skill 评分和安全性 |
| `insight_tests.rs` | 本地洞察、feed、高优先 feed |
| `wake_tests.rs` | 防睡模式、实验性 lid-awake 确认流程 |

### 测试命名

测试函数名应描述被验证的行为，使用 `snake_case`：

```rust
#[test]
fn profile_validation_rejects_missing_required_fields() { /* ... */ }

#[test]
fn secret_scanner_catches_token_like_profile_content() { /* ... */ }

#[test]
fn target_discovery_requires_explicit_local_read_authorization() { /* ... */ }
```

### 模块注册

在 `lib.rs` 中注册测试模块：

```rust
#[cfg(test)]
mod tests;
```

`tests/mod.rs` 声明各测试子模块：

```rust
mod profile_tests;
mod deploy_tests;
mod target_tests;
mod sync_governance_tests;
mod account_tests;
mod usage_tests;
mod registry_tests;
mod insight_tests;
mod wake_tests;
```

## 安全约束

- 当前阶段为 fixture 模式——不读写真实 Claude Code 或 Codex 配置目录。
- 当前阶段不执行 shell hook、远程 LLM 调用或后台日志收集。
- 不硬编码凭据或 token。
- 真实写入 API 在备份/验证/回滚机制就绪后开放。

## 代码风格

- `domain/` 中使用纯函数，`services/` 中使用薄副作用封装，`commands/` 中使用 typed 窄处理器。
- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]` 以匹配 TypeScript 类型。
- 使用 `Default` impl 定义 fixture 默认值（参见 `SyncPolicy::default()`、`ProfileMetadata::default()`）。
- 使用 `From` impl 做类型转换（参见 `ProfileSummary::from(&HarnessProfile)`）。

### 示例：带 serde 和 Default 的 domain 结构体

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPolicy {
    pub rules: String,
    pub skills: String,
    pub mcp_references: String,
    pub real_writes_allowed: bool,
}

impl Default for SyncPolicy {
    fn default() -> Self {
        Self {
            rules: "append-scoped-block".to_string(),
            skills: "copy-reference".to_string(),
            mcp_references: "target-override".to_string(),
            real_writes_allowed: false,
        }
    }
}
```

## 验证命令

```bash
cargo test --manifest-path src-tauri/Cargo.toml   # Rust 测试
pnpm lint                                          # ESLint
pnpm typecheck                                     # TypeScript
pnpm test                                          # Vitest
```
