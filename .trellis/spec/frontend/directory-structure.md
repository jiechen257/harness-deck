# Directory Structure

Frontend code lives under `src/`.

## Directory Layout

```text
src/
  main.tsx
  App.tsx
  app/
    copy.ts
    fixtures.ts
    navigation.ts
  components/
    BeidouMark.tsx
    MenuBarPanel.tsx
    Workbench.tsx
    ...
  lib/
    api.ts
    types.ts
    usePersistentPreference.ts
  styles/
    app.css
```

## Organization Rules

- `app/` contains app-level copy, navigation metadata, and frontend fixtures.
- `components/` contains presentational and workflow components.
- `lib/api.ts` is the only place that calls Tauri `invoke`.
- `lib/types.ts` mirrors IPC/domain contracts used by the frontend.
- `styles/` owns CSS tokens and layout styling.

## Routing

The first runnable app can use in-memory tab state instead of a router. Required views are:

- Home
- Discover
- Profiles / `配置集`
- Sync
- Operate
- Usage
- Insights
- Guard
- Settings

## Assets

Prefer CSS/tokenized Beidou star maps and existing image assets only when they support the product signal. Avoid large decorative illustrations.
