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
  findBestSkill,
  generateDeployPlan,
  getAccountWorkspace,
  getSyncGovernance,
  getUsageSummary,
  getWakeControl,
  listFeedItems,
  listHighPriorityFeed,
  listInsights,
  listProfiles,
  listRegistryTemplates,
  listTargets,
  requestWakeMode,
} from "./lib/api";
import type {
  AccountWorkspace,
  DeployPlan,
  FeedItem,
  FindBestSkillResult,
  Insight,
  Locale,
  ManifestSummary,
  ProfileSummary,
  RegistrySkillTemplate,
  SyncGovernance,
  TargetDiscoverySummary,
  TargetKind,
  TargetSummary,
  Theme,
  UsageSummary,
  WakeControlSummary,
  WakeSession,
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
  const [accountWorkspace, setAccountWorkspace] = useState<AccountWorkspace | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [registryTemplates, setRegistryTemplates] = useState<RegistrySkillTemplate[]>([]);
  const [skillRecommendation, setSkillRecommendation] = useState<FindBestSkillResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [highPriorityFeed, setHighPriorityFeed] = useState<FeedItem[]>([]);
  const [wakeSummary, setWakeSummary] = useState<WakeControlSummary | null>(null);
  const [confirmedWakeSession, setConfirmedWakeSession] = useState<WakeSession | null>(null);
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
    void Promise.all([
      listProfiles(),
      listTargets(),
      getAccountWorkspace(),
      getUsageSummary(),
      listRegistryTemplates(),
      findBestSkill("sync Claude Code and Codex rules safely", false),
      listInsights(),
      listFeedItems(),
      listHighPriorityFeed(),
      getWakeControl(),
    ]).then(
      ([
        nextProfiles,
        nextTargets,
        nextAccountWorkspace,
        nextUsageSummary,
        nextRegistryTemplates,
        nextSkillRecommendation,
        nextInsights,
        nextFeedItems,
        nextHighPriorityFeed,
        nextWakeSummary,
      ]) => {
        setProfiles(nextProfiles);
        setTargets(nextTargets);
        setAccountWorkspace(nextAccountWorkspace);
        setUsageSummary(nextUsageSummary);
        setRegistryTemplates(nextRegistryTemplates);
        setSkillRecommendation(nextSkillRecommendation);
        setInsights(nextInsights);
        setFeedItems(nextFeedItems);
        setHighPriorityFeed(nextHighPriorityFeed);
        setWakeSummary(nextWakeSummary);
        setSelectedProfileId(nextProfiles[0]?.id ?? "macos-dev");
        setSelectedTargetKind(nextTargets[0]?.kind ?? "Codex");
      },
    );
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

  const confirmExperimentalWake = async () => {
    const session = await requestWakeMode("ExperimentalLidAwake", true);
    setConfirmedWakeSession(session);
    setWakeSummary((current) => (current ? { ...current, currentState: session } : current));
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
                  cost: usageSummary
                    ? `${usageSummary.metrics.find((item) => item.id === "cost")?.value ?? `$${usageSummary.costUsd.toFixed(2)}`} · ${
                        usageSummary.metrics.find((item) => item.id === "cost")?.confidenceLabel ?? "Estimated"
                      }`
                    : metric.value,
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
            {highPriorityFeed[0] ? (
              <div className="menu-feed">
                <span>High priority</span>
                <strong>{highPriorityFeed[0].title}</strong>
              </div>
            ) : null}
          </aside>

          <section className="view-panel">
            <div className="panel-head">
              <span>{activeTitle}</span>
              <span className="status-dot muted">Dry-run</span>
            </div>
            {activeView === "discover" ? (
              <DiscoverView registryTemplates={registryTemplates} skillRecommendation={skillRecommendation} />
            ) : activeView === "profiles" ? (
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
            ) : activeView === "operate" ? (
              <OperateView
                confirmedWakeSession={confirmedWakeSession}
                locale={locale}
                onConfirmExperimentalWake={confirmExperimentalWake}
                wakeSummary={wakeSummary}
              />
            ) : activeView === "usage" ? (
              <UsageView locale={locale} usageSummary={usageSummary} />
            ) : activeView === "insights" ? (
              <InsightsView feedItems={feedItems} highPriorityFeed={highPriorityFeed} insights={insights} locale={locale} />
            ) : activeView === "settings" ? (
              <SettingsView accountWorkspace={accountWorkspace} locale={locale} theme={theme} />
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

function DiscoverView({
  registryTemplates,
  skillRecommendation,
}: {
  registryTemplates: RegistrySkillTemplate[];
  skillRecommendation: FindBestSkillResult | null;
}) {
  return (
    <div className="registry-workbench">
      <section className="registry-hero">
        <div>
          <h3>Registry 与 find-best-skill</h3>
          <p>Curated local registry first; GitHub discovery is gated and never called automatically.</p>
        </div>
        <span className="status-pill">Remote call not performed</span>
      </section>

      <div className="template-grid">
        {registryTemplates.map((template) => (
          <article key={template.id}>
            <div>
              <strong>{template.name}</strong>
              <span>{template.source}</span>
            </div>
            <p>{template.description}</p>
            <small>risk {template.safetyRisk}</small>
          </article>
        ))}
      </div>

      {skillRecommendation ? (
        <section className="skill-recommendation">
          <div>
            <span>Recommended</span>
            <strong>Recommended skill: {skillRecommendation.recommendedSkill.name}</strong>
            <p>{skillRecommendation.task}</p>
          </div>
          <div className="score-board">
            <span>{Math.round(skillRecommendation.score * 100)} score</span>
            <span>{skillRecommendation.safetySummary}</span>
            <span>{skillRecommendation.githubDiscoveryEnabled ? "GitHub discovery gated" : "GitHub discovery off"}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OperateView({
  confirmedWakeSession,
  locale,
  onConfirmExperimentalWake,
  wakeSummary,
}: {
  confirmedWakeSession: WakeSession | null;
  locale: Locale;
  onConfirmExperimentalWake: () => Promise<void>;
  wakeSummary: WakeControlSummary | null;
}) {
  if (!wakeSummary) {
    return <p className="muted-line">{locale === "zh-CN" ? "Wake Control 加载中" : "Loading Wake Control"}</p>;
  }

  return (
    <div className="wake-workbench">
      <section className="wake-hero">
        <div>
          <h3>Wake Control</h3>
          <p>{locale === "zh-CN" ? "当前阶段使用 mock/system-safe 控制，不修改系统电源策略。" : "This phase uses mock/system-safe controls and does not change system power policy."}</p>
        </div>
        <span className="status-pill">current: {wakeModeLabel(wakeSummary.currentState.mode)}</span>
      </section>

      <div className="wake-grid">
        {wakeSummary.quickActions.map((session) => (
          <article key={session.mode}>
            <strong>{session.mode === "ExperimentalLidAwake" ? "experimental lid-awake mode" : wakeModeLabel(session.mode)}</strong>
            <span>{session.implementation}</span>
            <small>
              {session.durationMinutes ? `${session.durationMinutes} min` : "continuous"} ·{" "}
              {session.requiresConfirmation ? "confirmation required" : "ready"}
            </small>
          </article>
        ))}
      </div>

      <section className="experimental-wake-panel">
        <div>
          <strong>experimental lid-awake</strong>
          <span>需要显式确认</span>
        </div>
        <button className="secondary-action" type="button" onClick={() => void onConfirmExperimentalWake()}>
          <Zap size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "确认实验性合盖防睡" : "Confirm experimental lid-awake"}</span>
        </button>
      </section>

      {confirmedWakeSession ? (
        <div className="wake-confirmed">experimental lid-awake confirmed (mock)</div>
      ) : null}
    </div>
  );
}

function InsightsView({
  feedItems,
  highPriorityFeed,
  insights,
  locale,
}: {
  feedItems: FeedItem[];
  highPriorityFeed: FeedItem[];
  insights: Insight[];
  locale: Locale;
}) {
  return (
    <div className="insight-workbench">
      <section className="insight-hero">
        <div>
          <h3>{locale === "zh-CN" ? "洞察与 Feed" : "Insights and Feed"}</h3>
          <p>{locale === "zh-CN" ? "本地规则覆盖 token anomaly、失败重复、profile drift 和 update impact。" : "Local rules cover token anomalies, repeated failures, profile drift, and update impact."}</p>
        </div>
        {highPriorityFeed[0] ? <span className="status-pill">High priority feed</span> : null}
      </section>

      <div className="insight-grid">
        {insights.map((insight) => (
          <article key={insight.id}>
            <strong>{insight.title}</strong>
            <p>{insight.summary}</p>
            <small>{insight.severity} · {insight.source}</small>
          </article>
        ))}
      </div>

      <section className="feed-list">
        {feedItems.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.priority}</span>
            </div>
            <p>{item.summary}</p>
            {item.profileImpact ? <small>profile impact</small> : <small>{item.source}</small>}
          </article>
        ))}
      </section>
    </div>
  );
}

function UsageView({ locale, usageSummary }: { locale: Locale; usageSummary: UsageSummary | null }) {
  if (!usageSummary) {
    return <p className="muted-line">{locale === "zh-CN" ? "用量数据加载中" : "Loading usage data"}</p>;
  }

  const costMetric = usageSummary.metrics.find((metric) => metric.id === "cost");
  const confidenceLabels = ["Official", "LocalLog", "Estimated", "Missing"];

  return (
    <div className="usage-dashboard">
      <section className="usage-hero">
        <div>
          <h3>{locale === "zh-CN" ? "用量与成本" : "Usage and Cost"}</h3>
          <p>
            {usageSummary.windowHours}h · {usageSummary.totalTokens.toLocaleString()} tokens ·{" "}
            {usageSummary.durationMinutes} min
          </p>
        </div>
        <strong>{costMetric?.value ?? `$${usageSummary.costUsd.toFixed(2)}`}</strong>
      </section>

      <div className="confidence-strip" aria-label="Usage confidence labels">
        {confidenceLabels.map((confidence) => (
          <span key={confidence}>{confidence}</span>
        ))}
      </div>

      <div className="metric-board">
        {usageSummary.metrics.map((metric) => (
          <article key={metric.id}>
            <span>{metric.label}</span>
            <strong>{metric.id === "cost" ? `${metric.value} ${metric.unit}` : metric.value}</strong>
            <small>
              {metric.unit || "source"} · {metric.confidenceLabel} confidence
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}

function wakeModeLabel(mode: WakeSession["mode"]) {
  switch (mode) {
    case "StandardAwake":
      return "standard awake";
    case "TimedAwake":
      return "timed awake";
    case "DisplaySleep":
      return "display sleep control";
    case "ExperimentalLidAwake":
      return "experimental lid-awake";
  }
}

function SettingsView({
  accountWorkspace,
  locale,
  theme,
}: {
  accountWorkspace: AccountWorkspace | null;
  locale: Locale;
  theme: Theme;
}) {
  if (!accountWorkspace) {
    return <p className="muted-line">{locale === "zh-CN" ? "账户工作区加载中" : "Loading account workspace"}</p>;
  }

  return (
    <div className="account-workspace">
      <section className="account-hero">
        <div>
          <h3>Account Workspace</h3>
          <p>{locale === "zh-CN" ? "账户、预算、模型和 Keychain 引用先以 mock/interface 形式落地。" : "Account, budget, model, and Keychain references are modeled through a mock/interface boundary."}</p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "不存储 secret 值" : "No secret values"}</span>
      </section>

      <div className="account-grid">
        <article>
          <span>Provider</span>
          <strong>{accountWorkspace.provider}</strong>
          <small>{accountWorkspace.baseUrl}</small>
        </article>
        <article>
          <span>Default model</span>
          <strong>{accountWorkspace.defaultModel}</strong>
          <small>${accountWorkspace.monthlyBudgetUsd.toFixed(0)} monthly budget</small>
        </article>
        <article>
          <span>Limits</span>
          <strong>{accountWorkspace.requestLimitPerDay}/day</strong>
          <small>{accountWorkspace.tokenLimitPerDay.toLocaleString()} tokens/day</small>
        </article>
        <article>
          <span>Preferences</span>
          <strong>{locale}</strong>
          <small>{theme} theme</small>
        </article>
      </div>

      <section className="keychain-panel">
        <div>
          <span>Keychain reference</span>
          <code>{accountWorkspace.keychainRef.reference}</code>
        </div>
        <strong>{accountWorkspace.keychainRef.secretPreview ?? "secret value hidden"}</strong>
      </section>

      <section className="switch-preview">
        <div className="section-title">
          <h3>Switch-plan preview</h3>
          <span className="status-pill">{accountWorkspace.switchPlanPreview.writesRealConfig ? "Real write" : "Preview only"}</span>
        </div>
        <p>
          {accountWorkspace.switchPlanPreview.fromModel} → {accountWorkspace.switchPlanPreview.toModel}
        </p>
        <small>
          +${accountWorkspace.switchPlanPreview.budgetDeltaUsd.toFixed(0)} projected budget ·{" "}
          {accountWorkspace.switchPlanPreview.requiresSecretValue ? "requires secret" : "uses existing Keychain reference"}
        </small>
      </section>

      <section className="audit-list">
        {accountWorkspace.auditTrail.map((entry) => (
          <article key={entry.id}>
            <strong>{entry.severity}</strong>
            <span>{entry.summary}</span>
          </article>
        ))}
      </section>
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
