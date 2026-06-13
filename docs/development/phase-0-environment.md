# HarnessDeck 第 0 阶段环境记录

记录日期：2026-06-07

## 检测结果

| 项目 | 结果 |
| --- | --- |
| macOS | 26.5, Build 25F71 |
| CPU 架构 | arm64 |
| Xcode Developer Path | `/Applications/Xcode.app/Contents/Developer` |
| Xcode | 26.5, Build 17F42 |
| clang | Apple clang 21.0.0, target `arm64-apple-darwin25.5.0` |
| Node | v24.16.0 |
| npm | 11.13.0 |
| pnpm | 10.33.2 |
| Rust | rustc 1.95.0 |
| Cargo | cargo 1.95.0 |
| rustup | rustup 1.29.0 |
| Rust toolchain | `stable-aarch64-apple-darwin` |
| Rust target | `aarch64-apple-darwin` |
| Tauri CLI | tauri-cli 2.11.2 |

## 安装过的项目依赖

| 依赖 | 版本 | 范围 |
| --- | --- | --- |
| `@tauri-apps/cli` | 2.11.2 | project devDependency |

## 使用过的命令

```bash
pnpm add -D @tauri-apps/cli@latest
pnpm tauri --version
pnpm list @tauri-apps/cli --depth=0
sw_vers
uname -m
xcode-select -p
xcodebuild -version
xcrun clang --version
node --version
npm --version
pnpm --version
rustc --version
cargo --version
rustup --version
rustup show active-toolchain
rustup target list --installed
```

## 缺失项处理

第 0 阶段检测到缺失 Tauri CLI。用户确认后采用项目本地依赖方式安装，未执行全局安装、`sudo`、Homebrew 安装或 shell profile 修改。

## 第 0 阶段验证

```bash
pnpm tauri --version
```

输出：

```text
tauri-cli 2.11.2
```
