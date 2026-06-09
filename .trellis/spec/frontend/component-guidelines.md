# Component Guidelines

## Component Shape

All components are inline function components defined inside `App.tsx`. They use typed props and keep workflow state lifted to the `App` component.

### Example: Inline view component

```tsx
// src/App.tsx — typical view component pattern
function UsageView({ locale, t }: { locale: Locale; t: typeof copy["zh-CN"] }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    getUsageSummary().then(setUsage);
  }, []);

  if (!usage) return null;
  return (
    <section className="view-section">
      <h2>{locale === "zh-CN" ? "用量与成本" : "Usage & Cost"}</h2>
      {usage.metrics.map((m) => (
        <div key={m.id} className="metric-row">
          <span>{m.label}</span>
          <span>{m.value} {m.unit}</span>
          <span className={`confidence-badge confidence-${m.confidence.toLowerCase()}`}>
            {m.confidenceLabel}
          </span>
        </div>
      ))}
    </section>
  );
}
```

## Data Flow

- Components receive `locale`, `t` (copy object), and callbacks as props.
- Tauri IPC calls stay in `lib/api.ts` — components call the typed wrapper, not `invoke()` directly.
- Fixture fallbacks in `api.ts` keep the app working in `pnpm dev` (browser) without the Rust backend.

### Example: API dual-path pattern

```tsx
// src/lib/api.ts
async function call<T>(command: string, args: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!isTauriRuntime()) return fallback();
  return invoke<T>(command, args);
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  return call("list_profiles", {}, () => fallbackProfiles);
}
```

## Visual Direction

- Light theme: warm gold-white base, low-saturation accents, deep blue and gilded details.
- Dark theme: midnight blue surface, gold accents.
- Dense developer-tool layout, clear dividers, compact controls.
- No star-name feature labels. No generic marketing hero.

## Controls

- Icon buttons (from `lucide-react`) for compact commands.
- Segmented controls for locale/theme/target switching.
- Sidebar nav buttons for 5 primary groups; secondary views via sub-tabs.
- Status pills for dry-run, fixture, risk, confidence, and disabled states.

## Accessibility

- Buttons must have visible text or an accessible label.
- Keyboard focus styles must be visible.
- State colors must be paired with text, not used alone.
- Navigation uses `aria-current="page"` for the active view.
