# Component Guidelines

## Component Shape

- Use function components and typed props.
- Keep workflow state near `App` unless a component needs private UI state.
- Keep Tauri IPC calls in `lib/api.ts`; components receive data or callbacks.
- Prefer small, named components for repeated surfaces such as metric rows, nav items, deploy operations, and policy rows.

## Visual Direction

HarnessDeck uses a restrained Beidou navigation and engineering instrument aesthetic:

- light theme: warm gold-white base, low-saturation star map, deep blue and gilded accents
- dark theme: midnight blue surface, gold star graph accents
- dense developer-tool layout, clear dividers, compact controls
- no star-name feature labels
- no generic marketing hero as the first screen

## Controls

- Use icon buttons for compact commands when an icon is available.
- Use segmented controls or button groups for locale/theme/target switching.
- Use tabs or nav buttons for the nine workbench views.
- Use status pills for dry-run, fixture, risk, confidence, and disabled states.

## Accessibility

- Buttons must have visible text or an accessible label.
- Maintain keyboard focus styles.
- Ensure text fits inside compact controls on desktop and small windows.
- State colors must be paired with text, not used alone.

## Common Mistakes

- Do not call Profiles `星位`, `星图节点`, or other Beidou-inspired function names.
- Do not translate product-generated profile names, target names, file paths, or manifest ids.
- Do not place all content inside nested cards.
