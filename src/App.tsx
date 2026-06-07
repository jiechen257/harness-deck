import {
  BarChart3,
  BellRing,
  CheckCircle2,
  Compass,
  Database,
  Gauge,
  Home,
  Languages,
  Layers,
  Moon,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  SunMedium,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Locale = "zh-CN" | "en-US";
type Theme = "light" | "dark";
type ViewId =
  | "home"
  | "discover"
  | "profiles"
  | "sync"
  | "operate"
  | "usage"
  | "insights"
  | "guard"
  | "settings";

interface NavItem {
  id: ViewId;
  icon: typeof Home;
  zh: string;
  en: string;
}

const navItems: NavItem[] = [
  { id: "home", icon: Home, zh: "首页", en: "Home" },
  { id: "discover", icon: Search, zh: "发现", en: "Discover" },
  { id: "profiles", icon: Layers, zh: "配置集", en: "Profiles" },
  { id: "sync", icon: Shuffle, zh: "同步", en: "Sync" },
  { id: "operate", icon: TerminalSquare, zh: "运行", en: "Operate" },
  { id: "usage", icon: BarChart3, zh: "用量", en: "Usage" },
  { id: "insights", icon: Sparkles, zh: "洞察", en: "Insights" },
  { id: "guard", icon: ShieldCheck, zh: "守护", en: "Guard" },
  { id: "settings", icon: Settings, zh: "设置", en: "Settings" },
];

const copy = {
  "zh-CN": {
    title: "HarnessDeck 工作台",
    subtitle: "本地优先的配置集、同步、运行、用量与守护控制台",
    switchLanguage: "English",
    switchThemeDark: "深色",
    switchThemeLight: "浅色",
    menuPanel: "菜单栏面板",
    currentProfile: "当前配置集",
    syncStatus: "同步状态",
    cost: "5 小时成本",
    wake: "防睡状态",
    quickActions: "快捷动作",
    dryRun: "运行 dry-run",
    refresh: "刷新状态",
    openWorkbench: "打开工作台",
    fixture: "Fixture 模式",
    activeProfile: "macOS Dev 配置集",
    syncReady: "dry-run 就绪",
    awakeStandard: "标准模式",
    localFirst: "本地优先",
    heroTitle: "配置集、同步、运行与守护集中在一个本地控制台。",
    heroBody: "北斗视觉用于导航感和状态识别，功能命名保持工程语义。当前默认锁定 fixture mode，不触碰真实 Claude Code 或 Codex 配置。",
    phaseStatus: "Implementation Design Phase 0",
  },
  "en-US": {
    title: "HarnessDeck Workbench",
    subtitle: "Local-first profiles, sync, operate, usage, and guard control center",
    switchLanguage: "中文",
    switchThemeDark: "Dark",
    switchThemeLight: "Light",
    menuPanel: "Menu Bar Panel",
    currentProfile: "Current Profile",
    syncStatus: "Sync Status",
    cost: "5h Cost",
    wake: "Wake State",
    quickActions: "Quick Actions",
    dryRun: "Run dry-run",
    refresh: "Refresh",
    openWorkbench: "Open Workbench",
    fixture: "Fixture mode",
    activeProfile: "macOS Dev Profile",
    syncReady: "dry-run ready",
    awakeStandard: "Standard",
    localFirst: "Local-first",
    heroTitle: "Profiles, sync, operation, and guardrails in one local control surface.",
    heroBody: "Beidou visuals support navigation and status awareness while feature names stay engineering-oriented. Fixture mode is locked by default and does not touch real Claude Code or Codex config.",
    phaseStatus: "Implementation Design Phase 0",
  },
} satisfies Record<Locale, Record<string, string>>;

const metricCards = [
  { id: "profile", value: "macOS Dev", tone: "blue" },
  { id: "sync", value: "Ready", tone: "green" },
  { id: "cost", value: "$4.82", tone: "gold" },
  { id: "wake", value: "On", tone: "teal" },
] as const;

function label(locale: Locale, item: NavItem) {
  return locale === "zh-CN" ? item.zh : item.en;
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem("harnessdeck.locale");
    return saved === "en-US" ? "en-US" : "zh-CN";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("harnessdeck.theme");
    return saved === "dark" ? "dark" : "light";
  });
  const [activeView, setActiveView] = useState<ViewId>("home");
  const t = copy[locale];

  useEffect(() => {
    window.localStorage.setItem("harnessdeck.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem("harnessdeck.theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const activeTitle = useMemo(() => {
    const item = navItems.find((nav) => nav.id === activeView) ?? navItems[0];
    return label(locale, item);
  }, [activeView, locale]);

  return (
    <div className="app-shell" data-theme={theme} data-testid="app-shell">
      <aside className="sidebar" aria-label="HarnessDeck navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>HarnessDeck</strong>
            <small>{t.localFirst}</small>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Workbench views">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = item.id === activeView;
            return (
              <button
                key={item.id}
                className={selected ? "nav-item active" : "nav-item"}
                type="button"
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label(locale, item)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workbench">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t.phaseStatus}</p>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button">
              <BellRing size={17} aria-hidden="true" />
              <span>{t.refresh}</span>
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
            >
              <Languages size={17} aria-hidden="true" />
              <span>{t.switchLanguage}</span>
            </button>
            <button type="button" className="icon-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={17} aria-hidden="true" /> : <SunMedium size={17} aria-hidden="true" />}
              <span>{theme === "light" ? t.switchThemeDark : t.switchThemeLight}</span>
            </button>
          </div>
        </header>

        <section className="content-grid">
          <section className="hero-panel" aria-labelledby="hero-title">
            <div className="star-field" aria-hidden="true">
              <i className="line line-one" />
              <i className="line line-two" />
              <i className="line line-three" />
              <b className="star star-a" />
              <b className="star star-b" />
              <b className="star star-c" />
              <b className="star star-d" />
              <b className="star star-e" />
              <b className="star star-f" />
              <b className="star star-g" />
            </div>
            <div className="hero-copy">
              <span className="status-pill">
                <CheckCircle2 size={15} aria-hidden="true" />
                {t.fixture}
              </span>
              <h2 id="hero-title">{t.heroTitle}</h2>
              <p>{t.heroBody}</p>
            </div>
            <div className="stage-strip" aria-label="Lifecycle stages">
              {navItems.slice(1, 8).map((item) => (
                <span key={item.id}>{label(locale, item)}</span>
              ))}
            </div>
          </section>

          <aside className="menu-panel" aria-label={t.menuPanel}>
            <div className="panel-head">
              <span>{t.menuPanel}</span>
              <span className="status-dot">Live</span>
            </div>
            <div className="metric-list">
              {metricCards.map((metric) => {
                const labels = {
                  profile: t.currentProfile,
                  sync: t.syncStatus,
                  cost: t.cost,
                  wake: t.wake,
                };
                const values = {
                  profile: t.activeProfile,
                  sync: t.syncReady,
                  cost: metric.value,
                  wake: t.awakeStandard,
                };
                return (
                  <div className="metric-row" key={metric.id}>
                    <span>{labels[metric.id]}</span>
                    <strong className={metric.tone}>{values[metric.id]}</strong>
                  </div>
                );
              })}
            </div>
            <div className="quick-actions">
              <p>{t.quickActions}</p>
              <button type="button">
                <Zap size={16} aria-hidden="true" />
                <span>{t.dryRun}</span>
              </button>
              <button type="button">
                <RotateCw size={16} aria-hidden="true" />
                <span>{t.refresh}</span>
              </button>
              <button type="button">
                <Gauge size={16} aria-hidden="true" />
                <span>{t.openWorkbench}</span>
              </button>
            </div>
          </aside>

          <section className="view-panel">
            <div className="panel-head">
              <span>{activeTitle}</span>
              <span className="status-dot muted">Dry-run</span>
            </div>
            <div className="summary-grid">
              <article>
                <Compass size={18} aria-hidden="true" />
                <strong>{locale === "zh-CN" ? "北斗视觉" : "Beidou visual"}</strong>
                <p>{locale === "zh-CN" ? "低饱和星图和鎏金节点保留品牌方向。" : "Low-saturation star maps and gold nodes preserve the brand direction."}</p>
              </article>
              <article>
                <Database size={18} aria-hidden="true" />
                <strong>{locale === "zh-CN" ? "本地数据" : "Local data"}</strong>
                <p>{locale === "zh-CN" ? "配置集、manifest、usage 和 guard 状态优先留在本机。" : "Profiles, manifests, usage, and guard state stay local-first."}</p>
              </article>
              <article>
                <ShieldCheck size={18} aria-hidden="true" />
                <strong>{locale === "zh-CN" ? "真实写入保护" : "Real-write protection"}</strong>
                <p>{locale === "zh-CN" ? "真实配置写入需要确认、备份、验证和 rollback 元数据。" : "Real config writes require confirmation, backup, verification, and rollback metadata."}</p>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
