# Frontend Development Guidelines

HarnessDeck frontend code is a React + TypeScript workbench rendered inside Tauri. It provides the main window, menu bar panel surface, localized UI, theme switching, fixture workflow views, and dry-run manifest previews.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | React module organization | Filled |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks and side-effect boundaries | Filled |
| [State Management](./state-management.md) | Locale, theme, profile, target, and manifest state | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Accessibility, tests, and design constraints | Filled |
| [Type Safety](./type-safety.md) | TypeScript and IPC contract rules | Filled |

## Pre-Development Checklist

Read these before frontend work:

- `AGENTS.md`
- `docs/product-design/harnessdeck-command-deck-prototype.html`
- `docs/superpowers/specs/2026-06-07-harness-deck-design.md`
- `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`
- `.trellis/spec/frontend/component-guidelines.md`
- `.trellis/spec/frontend/state-management.md`
- `.trellis/spec/frontend/quality-guidelines.md`
- `.trellis/spec/guides/index.md`

## Product UI Rules

- Default locale is Simplified Chinese.
- English switching must work.
- Default theme is light.
- Dark switching must work.
- Chinese UI uses `配置集` for Profiles.
- Beidou is a restrained visual language, not information architecture.
- Do not use star names such as Tianshu, Tianxuan, or Yaoguang as feature names.
