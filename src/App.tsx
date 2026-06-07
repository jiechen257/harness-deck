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

import {
  confirmDryRunDeploy,
  discoverTargets,
  generateDeployPlan,
  getSyncGovernance,
  listProfiles,
  listTargets,
} from "./lib/api";
import type {
  DeployPlan,
  Locale,
  ManifestSummary,
  ProfileSummary,
  SyncGovernance,
  TargetDiscoverySummary,
  TargetKind,
  TargetSummary,
  Theme,
} from "./lib/types";

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
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [targets, setTargets] = useState<TargetSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("macos-dev");
  const [selectedTargetKind, setSelectedTargetKind] = useState<TargetKind>("Codex");
  const [deployPlan, setDeployPlan] = useState<DeployPlan | null>(null);
  const [syncGovernance, setSyncGovernance] = useState<SyncGovernance | null>(null);
  const [targetDiscoveries, setTargetDiscoveries] = useState<TargetDiscoverySummary[]>([]);
  const [targetReadAuthorized, setTargetReadAuthorized] = useState(false);
  const [manifest, setManifest] = useState<ManifestSummary | null>(null);
  const t = copy[locale];

  useEffect(() => {
    window.localStorage.setItem("harnessdeck.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem("harnessdeck.theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void Promise.all([listProfiles(), listTargets()]).then(([nextProfiles, nextTargets]) => {
      setProfiles(nextProfiles);
      setTargets(nextTargets);
      setSelectedProfileId(nextProfiles[0]?.id ?? "macos-dev");
      setSelectedTargetKind(nextTargets[0]?.kind ?? "Codex");
    });
  }, []);

  useEffect(() => {
    if (!selectedProfileId || !selectedTargetKind) {
      return;
    }
    void Promise.all([
      generateDeployPlan(selectedProfileId, selectedTargetKind),
      getSyncGovernance(selectedProfileId, selectedTargetKind),
    ]).then(([nextPlan, nextGovernance]) => {
      setDeployPlan(nextPlan);
      setSyncGovernance(nextGovernance);
    });
  }, [selectedProfileId, selectedTargetKind]);

  const activeTitle = useMemo(() => {
    const item = navItems.find((nav) => nav.id === activeView) ?? navItems[0];
    return label(locale, item);
  }, [activeView, locale]);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  const confirmDryRun = async () => {
    if (!deployPlan) {
      return;
    }
    const nextManifest = await confirmDryRunDeploy(deployPlan);
    setManifest(nextManifest);
  };

  const authorizeTargetRead = async () => {
    const discoveries = await discoverTargets(true);
    setTargetReadAuthorized(true);
    setTargetDiscoveries(discoveries);
  };

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
                  sync: manifest ? (locale === "zh-CN" ? "manifest 已写入" : "manifest written") : t.syncReady,
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
            {activeView === "profiles" ? (
              <ProfileView
                locale={locale}
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                setSelectedProfileId={setSelectedProfileId}
                targets={targets}
                selectedTargetKind={selectedTargetKind}
                setSelectedTargetKind={setSelectedTargetKind}
              />
            ) : activeView === "sync" ? (
              <SyncView
                locale={locale}
                plan={deployPlan}
                manifest={manifest}
                onAuthorizeTargetRead={authorizeTargetRead}
                onConfirm={confirmDryRun}
                profile={selectedProfile}
                syncGovernance={syncGovernance}
                targetDiscoveries={targetDiscoveries}
                targetReadAuthorized={targetReadAuthorized}
              />
            ) : (
              <FoundationSummary locale={locale} />
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

interface ProfileViewProps {
  locale: Locale;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  setSelectedProfileId: (profileId: string) => void;
  targets: TargetSummary[];
  selectedTargetKind: TargetKind;
  setSelectedTargetKind: (targetKind: TargetKind) => void;
}

function ProfileView({
  locale,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  targets,
  selectedTargetKind,
  setSelectedTargetKind,
}: ProfileViewProps) {
  return (
    <div className="workflow-grid">
      <div>
        <h3>{locale === "zh-CN" ? "配置集" : "Profiles"}</h3>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              className={profile.id === selectedProfileId ? "profile-card selected" : "profile-card"}
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
            >
              <strong>{profile.name}</strong>
              <span>{profile.description}</span>
              <small>
                {profile.rules} rules · {profile.skills} skills · {profile.mcpReferences} MCP
              </small>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3>Targets</h3>
        <div className="target-list">
          {targets.map((target) => (
            <button
              className={target.kind === selectedTargetKind ? "target-card selected" : "target-card"}
              key={target.kind}
              type="button"
              onClick={() => setSelectedTargetKind(target.kind)}
            >
              <strong>{target.name}</strong>
              <span>{target.status}</span>
              <small>{target.fixture ? "Fixture" : "Real target"}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SyncViewProps {
  locale: Locale;
  plan: DeployPlan | null;
  manifest: ManifestSummary | null;
  profile?: ProfileSummary;
  syncGovernance: SyncGovernance | null;
  targetDiscoveries: TargetDiscoverySummary[];
  targetReadAuthorized: boolean;
  onAuthorizeTargetRead: () => Promise<void>;
  onConfirm: () => Promise<void>;
}

function SyncView({
  locale,
  plan,
  manifest,
  profile,
  syncGovernance,
  targetDiscoveries,
  targetReadAuthorized,
  onAuthorizeTargetRead,
  onConfirm,
}: SyncViewProps) {
  return (
    <div className="sync-layout">
      {manifest ? (
        <div className="manifest-banner">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>{locale === "zh-CN" ? "dry-run manifest 已写入" : "Dry-run manifest written"}</strong>
            <span>{locale === "zh-CN" ? "未触碰真实配置" : "No real config touched"}</span>
          </div>
          <code>{manifest.id}</code>
        </div>
      ) : null}
      <div className="deploy-plan">
        <div className="section-title">
          <h3>Deploy Plan</h3>
          <span className="status-pill">{plan?.dryRun ? "Dry-run" : "Loading"}</span>
        </div>
        <p className="muted-line">
          {profile?.name ?? "macOS Dev"} → {plan?.targetKind ?? "Codex"}
        </p>
        <div className="operation-list">
          {plan?.operations.map((operation) => (
            <article key={operation.id}>
              <div>
                <strong>{operation.operationType}</strong>
                <span>{operation.path}</span>
              </div>
              <p>{operation.reason}</p>
              <small>
                {operation.beforeSummary} → {operation.afterSummary}
              </small>
            </article>
          ))}
        </div>
        <button className="primary-action" type="button" onClick={() => void onConfirm()}>
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "确认 dry-run" : "Confirm dry-run"}</span>
        </button>
      </div>
      <section className="target-discovery-panel">
        <div className="section-title">
          <h3>{locale === "zh-CN" ? "Safe Target Integration" : "Safe Target Integration"}</h3>
          <span className="status-pill">{targetReadAuthorized ? "Authorized" : locale === "zh-CN" ? "本地读取未授权" : "Local read not authorized"}</span>
        </div>
        <p className="muted-line">
          {locale === "zh-CN"
            ? "默认只使用 fixture target；读取 ~/.codex 或 ~/.claude 需要显式授权，并且只返回安全摘要。"
            : "Fixture targets stay default; reading ~/.codex or ~/.claude requires explicit authorization and returns safe summaries only."}
        </p>
        <button className="secondary-action" type="button" onClick={() => void onAuthorizeTargetRead()}>
          <Search size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "授权读取本地 target" : "Authorize local target read"}</span>
        </button>
        {targetDiscoveries.length > 0 ? (
          <div className="target-discovery-list">
            {targetDiscoveries.map((target) => (
              <article key={target.kind}>
                <div>
                  <strong>{target.name}</strong>
                  <span>{target.discovered ? "discovered" : target.schemaStatus}</span>
                </div>
                <small>{target.candidatePaths.join(" · ")}</small>
                <em>{target.rawConfigPreview ?? "raw config hidden"}</em>
              </article>
            ))}
          </div>
        ) : null}
      </section>
      {syncGovernance ? (
        <section className="governance-grid" aria-label="Sync governance">
          <article>
            <h3>Three-way Diff</h3>
            <div className="governance-list">
              {syncGovernance.threeWayDiff.map((entry) => (
                <div key={entry.path}>
                  <strong>{entry.path}</strong>
                  <span>{entry.baseSummary}</span>
                  <span>{entry.targetSummary}</span>
                  <span>{entry.plannedSummary}</span>
                </div>
              ))}
            </div>
          </article>
          <article>
            <h3>Conflict Queue</h3>
            <div className="governance-list">
              {syncGovernance.conflicts.map((conflict) => (
                <div key={conflict.id}>
                  <strong>{conflict.path}</strong>
                  <span>{conflict.summary}</span>
                  <span>{conflict.resolution}</span>
                </div>
              ))}
            </div>
          </article>
          <article>
            <h3>Drift Detection</h3>
            <p>{syncGovernance.drift.summary}</p>
            <small>{syncGovernance.drift.detected ? `${syncGovernance.drift.count} drift signals` : "no drift"}</small>
          </article>
          <article>
            <h3>Rollback Preview</h3>
            <p>{syncGovernance.rollbackPreview.summary}</p>
            <small>
              backup {syncGovernance.rollbackPreview.backupRequired ? "required" : "optional"} · manifest{" "}
              {syncGovernance.rollbackPreview.manifestRequired ? "required" : "optional"}
            </small>
          </article>
        </section>
      ) : null}
    </div>
  );
}

function FoundationSummary({ locale }: { locale: Locale }) {
  return (
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
  );
}
