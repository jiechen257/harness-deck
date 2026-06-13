# HarnessDeck macOS 原生技术栈重构方案

## 背景

当前 HarnessDeck 使用 Tauri 2 + React + TypeScript + Rust 实现。这个方案在早期验证阶段带来了较快的 UI 迭代速度，但当前产品形态已经明显偏向 macOS 菜单栏工具和本地工作台，核心体验依赖：

- 菜单栏图标左键弹出 panel。
- panel 的定位、失焦隐藏、阴影、圆角和系统材料。
- 管理窗口的原生标题栏、快捷键、焦点、滚动、辅助功能。
- Keychain、本地文件、备份、manifest、系统防睡、通知、更新等 macOS 能力。

这些能力都位于 native-feel-skill 所说的 “below the WebView” 层。继续用 Tauri/React 模拟会持续遇到窗口行为、菜单栏面板、输入焦点、系统材料和可访问性边界。

## 本机 Mole.app 证据

本方案参考本机 `/Applications/Mole.app` 的 bundle 结构和二进制依赖。以下信息来自本机命令检查：

- `Info.plist`
  - `CFBundleIdentifier`: `com.tw93.MoleApp`
  - `CFBundleExecutable`: `Mole`
  - `LSMinimumSystemVersion`: `14.0`
  - `CFBundleURLSchemes`: `mole`
  - Sparkle 更新配置：`SUFeedURL`、`SUPublicEDKey`、`SUEnableAutomaticChecks`
  - 系统权限说明：Downloads、Documents、Desktop、System Administration
- Mach-O
  - Universal binary：`x86_64` + `arm64`
  - 主程序依赖 `SwiftUI.framework`、`AppKit.framework`、`Combine.framework`、`Security.framework`、`ServiceManagement.framework`、`UserNotifications.framework`、`IOKit.framework`
  - 依赖 `@rpath/Sparkle.framework`
  - 字符串和符号中可见 `NSStatusItem`、`NSStatusBarButton`、`NSMenu`、`SMCBridge`、`SparkleAppUpdater`
- Bundle 结构
  - `Contents/MacOS/Mole`
  - `Contents/Helpers/mole-smc`
  - 多语言 `*.lproj/Localizable.strings`
  - `Assets.car` 和 `.icns` 资源

结论：Mole 是 Swift/SwiftUI + AppKit interop 的 macOS 原生应用，状态栏、菜单、更新、系统 helper、权限说明和多语言资源都由 macOS 原生体系承载。

## 目标架构

推荐将 HarnessDeck 转为 macOS-only 原生应用：

```text
HarnessDeck.app
├─ SwiftUI App entry
├─ AppKit Shell
│  ├─ NSStatusItem
│  ├─ NSPopover / NSPanel menu panel
│  ├─ NSWindowController workbench window
│  ├─ NSMenu commands
│  └─ Settings scene
├─ SwiftUI Feature Views
│  ├─ Home
│  ├─ Discover
│  ├─ Profiles
│  ├─ Sync
│  ├─ Operate
│  ├─ Usage
│  ├─ Insights
│  ├─ Guard
│  └─ Settings
├─ Domain Core
│  ├─ Profile
│  ├─ Target
│  ├─ DeployPlan
│  ├─ Manifest
│  ├─ Backup
│  ├─ Usage
│  └─ GuardPolicy
├─ Local Services
│  ├─ SQLite / GRDB
│  ├─ Keychain
│  ├─ FileScanner
│  ├─ DiffPlanner
│  ├─ BackupWriter
│  ├─ ManifestStore
│  └─ AuditLog
├─ macOS Integrations
│  ├─ UserNotifications
│  ├─ ServiceManagement / Login Items
│  ├─ Process / power assertions
│  ├─ Sparkle updater
│  └─ Optional XPC helper
└─ Tests
   ├─ Swift Testing / XCTest
   ├─ Snapshot tests
   └─ File-system fixture tests
```

## 技术选择

| 领域 | 当前实现 | 原生重构建议 | 取舍 |
| --- | --- | --- | --- |
| App shell | Tauri window + tray | SwiftUI App + AppKit `NSStatusItem` / `NSWindowController` | 获得真正菜单栏和窗口行为，失去 Tauri 跨端壳 |
| 菜单栏面板 | Tauri hidden webview window | `NSPopover` 或 borderless `NSPanel` anchored to status item | 定位、失焦、阴影、圆角更自然，需要 AppKit interop |
| 工作台 UI | React components | SwiftUI views + AppKit window tuning | 原生控件、可访问性更好，UI 需要重写 |
| 状态管理 | React state + fallback API | `@Observable` / `ObservableObject` + actor services | 与 Swift 并发模型一致，迁移成本高 |
| 本地命令 | Tauri invoke -> Rust commands | Swift service protocols + async/await | 类型统一，少一层 IPC |
| 数据模型 | Rust domain structs + TS types | Swift structs/enums + Codable + tests | 单语言维护，需移植 Rust 测试 |
| SQLite | 预留 / mock | SQLite + GRDB | 比 SwiftData 更适合 manifest/audit/diff 这类确定 schema |
| Keychain | mock interface | Security.framework Keychain wrapper | 可真实保存引用和 secret，需权限和错误建模 |
| Diff / backup / manifest | Rust services | Swift domain services，必要时保留 Rust core | Swift-only 更简单；复杂 diff 可继续用 Rust 静态库 |
| Wake control | mock/system-safe | IOKit power assertions + 可选 helper | 能接近真实系统能力，但必须保留显式确认 |
| 更新 | 无 | Sparkle 2 | 对齐 Mole，增加签名和发布复杂度 |
| 多语言 | React copy object | `.strings` / String Catalog | 原生本地化流程，文案迁移成本 |
| 测试 | Vitest + Rust tests | Swift Testing / XCTest + fixture tests | 测试体系统一到 Xcode/SwiftPM |

## 推荐模块拆分

```text
Packages/
├─ HarnessDeckCore
│  ├─ Profiles
│  ├─ Targets
│  ├─ Sync
│  ├─ Usage
│  ├─ Insights
│  └─ Guard
├─ HarnessDeckStorage
│  ├─ SQLiteStore
│  ├─ ManifestStore
│  ├─ BackupStore
│  └─ AuditStore
├─ HarnessDeckSystem
│  ├─ KeychainStore
│  ├─ StatusBarController
│  ├─ WakeController
│  ├─ NotificationController
│  └─ LoginItemController
└─ HarnessDeckUI
   ├─ MenuPanel
   ├─ Workbench
   ├─ Settings
   └─ DesignSystem
```

原则：

- `HarnessDeckCore` 不依赖 UI。
- 真实写入必须经过 `DeployPlan -> Diff -> Backup -> Manifest -> Audit`。
- `HarnessDeckSystem` 封装所有 AppKit / Security / IOKit / ServiceManagement 细节。
- UI 只调用 service protocol，测试可注入 fixture implementation。

## 菜单栏面板重构目标

Mole 的交互给 HarnessDeck 的参考是：

- 菜单栏图标常驻。
- 左键点击图标弹出 panel。
- panel 锚定图标位置。
- panel 失焦自动隐藏。
- 右键或系统菜单保留 Quit / Settings 等维护入口。
- panel 尽量用系统材料、系统阴影、系统圆角。

原生实现建议：

- `NSStatusItem` 创建菜单栏图标。
- `NSPopover` 承载 SwiftUI `MenuPanelView`，用 `NSHostingController` 包裹。
- 如果需要 Mole 那种大面板和更强自定义阴影，使用 borderless `NSPanel`，但仍由 `NSStatusBarButton` 的 frame 计算 anchor。
- 避免在 WebView 内模拟 traffic lights、窗口阴影、popover pointer。

## 迁移阶段

### Phase 0：原生 shell spike

目标：证明原生壳能承载当前交互。

- 新建 `HarnessDeckNative.xcodeproj` 或 SwiftPM app。
- 实现 `NSStatusItem`。
- 左键打开 `NSPopover` 菜单栏面板。
- 实现独立 workbench window。
- 使用 fixture 数据展示当前配置集、同步健康度、成本、防睡。
- 实现中文默认、英文切换、浅色默认、深色跟随/切换。

验收：

- 不启动 Tauri/Vite/React。
- panel 从菜单栏图标左键打开，失焦隐藏。
- workbench 只显示实际工作台，不包含原型演示 shell。

### Phase 1：Domain model 移植

目标：把当前 Rust/TS domain 移到 Swift。

- 移植 Profile、Target、DeployPlan、Manifest、Backup、Usage、GuardPolicy。
- 移植 fixture 数据。
- 用 Swift Testing/XCTest 重建当前 16 个 Rust domain/service 测试。
- 保留“不触碰真实用户配置”的默认边界。

验收：

- Swift 测试覆盖 profile validation、secret scan、dry-run plan、manifest、target discovery gate、diff/drift/rollback、usage confidence、guard policy。

### Phase 2：本地持久化与安全边界

目标：把 mock interface 变成真实本地服务。

- SQLite + GRDB 建表：profiles、targets、manifests、backups、usage_events、audit_events。
- Keychain wrapper 保存 secret value，SQLite 只保存 keychain reference。
- manifest 和 backup 写入 Application Support。
- 所有真实写入入口保持关闭，需要显式确认开关。

验收：

- dry-run manifest 可持久保存和读取。
- Keychain 测试不暴露 secret value。
- audit trail 记录账号切换、授权、本地读取、真实写入确认。

### Phase 3：Target adapters 与同步工作流

目标：真实扫描和安全同步 Codex / Claude Code。

- Codex adapter：读取 `~/.codex`，只输出安全摘要。
- Claude Code adapter：读取 `~/.claude`，只输出安全摘要。
- Three-way diff、conflict queue、deploy plan、backup preview。
- 真实写入仍 gated。

验收：

- 未授权时只使用 fixture target。
- 授权后仅返回摘要，不展示 raw config。
- 真实写入必须生成 backup + manifest。

### Phase 4：系统集成

目标：补齐 macOS-native 能力。

- UserNotifications 替代 web toast。
- Sparkle 更新。
- Login Item opt-in。
- Wake control 用 IOKit power assertions，实验性能力保持显式确认。
- Optional helper 只用于确需提升权限的系统任务。

验收：

- 不使用 sudo 或静默提权。
- 所有系统权限都有 Info.plist usage description。
- 用户可关闭所有系统级能力。

### Phase 5：切流与退役 Tauri

目标：以原生 app 替代 Tauri app。

- README 改为 Swift/Xcode/SwiftPM 命令。
- 保留旧 Tauri 分支或归档 tag。
- 迁移现有文档、视觉 token、fixture。
- 删除 Vite/Tauri 构建链。

验收：

- 本地能通过 Xcode/SwiftPM 启动、测试、归档。
- Tauri/Vite 不再是运行依赖。

## 改造后的优势

- 菜单栏 panel、失焦隐藏、窗口层级和定位更接近 Mole 这类原生工具。
- 工作台窗口使用真实 macOS titlebar、菜单、快捷键和 accessibility。
- Keychain、通知、Login Item、Sparkle、power assertion 都可走官方框架。
- 启动路径更短，少了 WebView/Vite/React/Tauri runtime 的心智负担。
- UI 细节不再通过 CSS 模拟 native controls。
- 打包、权限、URL scheme、更新和本地化都纳入 macOS 标准流程。

## 改造后的代价

- 失去 React/Vite 的快速迭代体验。
- 现有 TSX/CSS UI 基本需要重写。
- 当前 Rust service 层要么移植到 Swift，要么通过 Rust static library/UniFFI 保留，二者都有成本。
- 跨平台能力基本放弃；如果未来要 Windows，需要单独 WinUI/WPF 方案。
- SwiftUI/AppKit interop 有学习曲线，复杂窗口和 popover 仍需要 AppKit 经验。
- 测试体系要从 Vitest/Rust test 迁移到 Swift Testing/XCTest。

## 推荐结论

如果 HarnessDeck 的产品方向确定为 macOS 本地优先菜单栏工作台，建议迁移到 SwiftUI + AppKit 原生栈。当前 Tauri 版本可以继续作为产品语义和 fixture workflow 的参考实现，但不应继续作为最终体验基线。

推荐先做 Phase 0 原生 shell spike。这个阶段成本最小，却能最快验证关键风险：菜单栏 panel、工作台窗口、主题/语言、fixture 数据展示和基础快捷键。如果 Phase 0 明显优于 Tauri 版本，再继续迁移 domain 和 storage。
