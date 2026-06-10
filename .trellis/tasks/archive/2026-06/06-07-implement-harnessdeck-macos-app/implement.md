# HarnessDeck 实现计划

## Phase 0：环境与基础

- 创建 package 元数据后安装本地项目 Tauri CLI 依赖。
- 重新检查 macOS、Xcode、Node、pnpm、Rust、Cargo、rustup 和 Tauri CLI 版本。
- 将环境结果记录到项目文档中。
- 验证 `pnpm tauri --version`。
- 提交 Phase 0。

## 实现设计 Phase 0：项目基础

- 添加 `package.json`、pnpm lockfile、Vite/React/TypeScript 配置和 Tauri 配置。
- 添加 `src/` React 应用，包含首页、发现、配置集、同步、运营、用量、洞察、防护和设置。
- 在主 UI 中添加菜单栏面板，并在可行范围内配置 Tauri 托盘/菜单。
- 实现默认中文语言、英文切换、默认浅色主题和深色切换。
- 基于 HTML 原型用真实组件和 CSS token 重建核心视觉方向。
- 验证 lint、typecheck、前端测试，以及本地环境允许范围内的 Tauri dev/build。
- 提交 Phase 1。

## 实现设计 Phase 1：本地核心循环

- 添加 Rust 领域模型：配置集、目标、部署计划、清单、用量和防护策略。
- 添加示例配置集和 Codex/Claude Code 目标的 fixture。
- 添加 Rust 服务：配置集列表、目标列表、密钥扫描、部署计划生成、应用路径和清单存储。
- 添加 Rust 单元测试：配置集验证、密钥扫描、部署计划生成和清单读写。
- 暴露类型化的 Tauri 命令。
- 将前端 API 调用对接到 Tauri 命令：配置集列表、目标列表、部署计划、dry-run 确认和最新清单。
- 在工作台和菜单栏面板中展示最新的 dry-run 状态。
- 提交实现设计 Phase 1。

## 实现设计 Phase 2：安全目标集成

- 添加 opt-in 本地读取授权模型用于目标发现。
- 实现 Claude Code 和 Codex 发现/读取/验证服务，返回安全摘要。
- 在缺少备份、预览、确认、清单、验证和回滚元数据时保持真实写入不可用。
- 添加测试证明 fixture 模式为默认，且真实目标读取需要授权。

## 实现设计 Phase 3：同步治理

- 实现三方 diff 数据模型。
- 实现冲突队列、漂移检测、回滚预览和备份元数据。
- 在同步视图中展示部署计划/diff/冲突/回滚状态。
- 添加漂移和冲突计算的测试。
- 提交实现设计 Phase 2 和 Phase 3。

## 实现设计 Phase 4：账户工作区

- 添加账户工作区模型：提供商、Base URL、默认模型、预算、限额和 Keychain 引用。
- 添加 mock Keychain/引用服务和审计轨迹条目。
- 在 UI 中展示账户设置和切换计划预览。
- 添加密钥引用处理的测试（不存储密钥值）。

## 实现设计 Phase 5：用量与费用

- 添加用量模型，含官方、本地日志、估算和缺失四种置信度。
- 实现本地聚合 fixture：token 数、费用、时长、漂移和消耗速率。
- 在用量视图和菜单面板中展示来源置信度标签。
- 添加置信度标注和聚合的测试。
- 提交实现设计 Phase 4 和 Phase 5。

## 实现设计 Phase 6：注册中心与 find-best-skill

- 添加策展的本地注册中心 fixture。
- 实现 `find-best-skill` 评分：任务匹配度、质量、社区信号、个人反馈和安全风险。
- 添加可选的 GitHub 发现 UI 管控（不自动发起远程调用）。
- 添加评分和安全风险展示的测试。

## 实现设计 Phase 7：洞察与 Feed

- 添加本地规则洞察引擎：token 异常、重复失败、配置集漂移和更新影响。
- 添加 Feed 模型：官方、社区、注册中心和配置集影响警报。
- 在菜单面板中展示配置集相关的高优先级 Feed 条目，在工作台中展示完整 Feed。
- 添加本地洞察规则的测试。

## 实现设计 Phase 8：唤醒控制

- 添加唤醒会话模型：标准唤醒、定时唤醒、显示器睡眠和实验性合盖唤醒状态。
- 对无法在此阶段安全变更的控制使用 mock/system-safe 实现。
- 实验性合盖唤醒需要显式确认。
- 在运营视图和菜单面板中展示唤醒状态和快捷操作。
- 添加确认管控的测试。
- 提交实现设计 Phase 6、7 和 8。

## 安全边界

- 确保 fixture 模式默认启用且可见。
- 确保真实写入在命令层面被阻止。
- 确保无硬编码密钥。
- 确保 Keychain 仅为接口/mock。
- 确保破坏性操作需要未来的 dry-run、清单和备份。
- 添加真实写入阻止行为和密钥检测的测试。
- 如实现设计阶段提交后仍需变更，则提交安全审计。

## 验证与交付

- 运行 `pnpm lint`。
- 运行 `pnpm typecheck`。
- 运行 `pnpm test`。
- 运行 `cargo test --manifest-path src-tauri/Cargo.toml`。
- 运行 `pnpm tauri build`。
- 使用 `pnpm tauri dev` 或项目运行脚本启动应用并验证启动状态。
- 总结环境、已安装依赖、启动命令、测试命令、构建命令、已实现功能、mock 功能和后续建议。
- 如有文件变更则提交最终交付更新。

## 已知验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build
pnpm tauri dev
```

## 护栏

- 不执行 `git push`。
- 不使用 sudo、brew 或 shell 配置编辑安装系统依赖。
- 不写入真实 Claude/Codex 配置。
- 不上传提示词、源代码、密钥或本地配置。
