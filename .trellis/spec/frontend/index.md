# Frontend Development Guidelines

HarnessDeck frontend code is a React + TypeScript workbench rendered inside Tauri. It provides the main window, menubar panel surface, localized UI, theme switching, fixture workflow views, and dry-run manifest previews.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Flat layout, `App.tsx`-centric architecture, no router | Filled |
| [Component Guidelines](./component-guidelines.md) | Inline components, API dual-path, visual direction, accessibility | Filled |
| [Hook Guidelines](./hook-guidelines.md) | useState/useEffect patterns, localStorage persistence, data fetching | Filled |
| [State Management](./state-management.md) | Locale/theme/view state, copy object, confidence labels | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Test structure, coverage areas, design constraints, verification | Filled |
| [Type Safety](./type-safety.md) | Union types, Rust-TS serde contract, no-any rule, copy typing | Filled |

## Pre-Development Checklist

Read these before frontend work:

- `CLAUDE.md` — project overview, commands, architecture, key conventions
- `.trellis/spec/frontend/directory-structure.md` — flat layout, key files
- `.trellis/spec/frontend/component-guidelines.md` — inline component pattern and API dual-path
- `.trellis/spec/frontend/state-management.md` — locale/theme/view state
- `.trellis/spec/frontend/quality-guidelines.md` — test coverage and design constraints

## Product UI Rules

- Default locale is Simplified Chinese (`zh-CN`); English switching must work.
- Default theme is light; dark switching must work.
- Chinese UI uses `配置集` for Profiles.
- Visual language is restrained engineering aesthetic, not marketing.
- Do not use star names (Tianshu, Tianxuan, Yaoguang) as feature names.
- Product-generated names (profile names, target names, file paths, manifest IDs) are never translated.
