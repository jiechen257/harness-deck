import {
  BarChart3,
  Cable,
  CheckCircle2,
  Command,
  Gauge,
  Home,
  Languages,
  Layers,
  Moon,
  RotateCw,
  Search,
  ShieldCheck,
  Shuffle,
  Sparkles,
  SunMedium,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  openWorkbench as openWorkbenchWindow,
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
  matches?: ViewId[];
  zh: string;
  en: string;
}

const navItems: NavItem[] = [
  { id: "home", icon: Home, zh: "首页", en: "Home" },
  { id: "profiles", icon: Layers, matches: ["discover", "settings"], zh: "配置", en: "Configure" },
  { id: "sync", icon: Shuffle, matches: ["guard"], zh: "同步", en: "Sync" },
  { id: "operate", icon: TerminalSquare, zh: "运行", en: "Operate" },
  { id: "insights", icon: Sparkles, matches: ["usage"], zh: "洞察", en: "Insights" },
];

const viewLabels: Record<ViewId, { zh: string; en: string }> = {
  home: { zh: "首页", en: "Home" },
  discover: { zh: "发现", en: "Discover" },
  profiles: { zh: "配置集", en: "Profiles" },
  sync: { zh: "同步", en: "Sync" },
  operate: { zh: "运行", en: "Operate" },
  usage: { zh: "用量", en: "Usage" },
  insights: { zh: "洞察", en: "Insights" },
  guard: { zh: "守护", en: "Guard" },
  settings: { zh: "设置", en: "Settings" },
};

const copy = {
  "zh-CN": {
    title: "HarnessDeck 命令中心",
    subtitle: "本地 Harness 工作台",
    nativeStatusTitle: "HarnessDeck 控制台",
    nativeStatusSubtitle: "本地 Harness 产品闭环",
    nativeHealthLabel: "工作台健康度",
    nativePressure: "安全同步就绪",
    rewritePlan: "产品闭环",
    phaseZero: "Dry-run",
    statusWorkbench: "产品功能状态",
    moduleTable: "产品工作流队列",
    improvementQueue: "改进建议",
    switchLanguage: "English",
    switchThemeDark: "深色",
    switchThemeLight: "浅色",
    command: "命令",
    menuPanel: "菜单栏面板",
    currentProfile: "当前配置集",
    syncStatus: "同步健康度",
    cost: "5 小时成本",
    wake: "防睡",
    quickActions: "快捷动作",
    dryRun: "运行 dry-run",
    refresh: "刷新状态",
    openWorkbench: "打开工作台",
    switchProfile: "切换配置集",
    fixture: "Fixture 模式",
    activeProfile: "macOS Dev 配置集",
    syncReady: "dry-run 就绪",
    awakeStandard: "标准模式",
    localFirst: "本地优先",
    workbenchTitle: "HarnessDeck 工作台",
    lifecycle: "工作流",
    localReady: "本地就绪",
    searchPlaceholder: "搜索配置集、同步、账号",
    dryRunPlanReady: "dry-run 部署计划就绪",
    target: "目标",
    feed: "高优先",
    heroTitle: "把配置集、同步、运行、用量与守护压进一个本地优先的控制面。",
    heroBody: "功能命名保持工程语义。当前默认锁定 fixture mode，不触碰真实 Claude Code 或 Codex 配置。",
    phaseStatus: "Local-first agent operations",
  },
  "en-US": {
    title: "HarnessDeck Command Center",
    subtitle: "Local Harness Workbench",
    nativeStatusTitle: "HarnessDeck Console",
    nativeStatusSubtitle: "Local Harness product loop",
    nativeHealthLabel: "Workbench health",
    nativePressure: "Safe sync ready",
    rewritePlan: "Product loop",
    phaseZero: "Dry-run",
    statusWorkbench: "Product function status",
    moduleTable: "Product workflow queue",
    improvementQueue: "Improvement queue",
    switchLanguage: "中文",
    switchThemeDark: "Dark",
    switchThemeLight: "Light",
    command: "Command",
    menuPanel: "Menu Bar Panel",
    currentProfile: "Current Profile",
    syncStatus: "Sync Health",
    cost: "5h Cost",
    wake: "Wake",
    quickActions: "Quick Actions",
    dryRun: "Run dry-run",
    refresh: "Refresh",
    openWorkbench: "Open Workbench",
    switchProfile: "Switch Profile",
    fixture: "Fixture mode",
    activeProfile: "macOS Dev Profile",
    syncReady: "dry-run ready",
    awakeStandard: "Standard",
    localFirst: "Local-first",
    workbenchTitle: "HarnessDeck Workbench",
    lifecycle: "Lifecycle",
    localReady: "Local ready",
    searchPlaceholder: "Search profiles, sync, accounts",
    dryRunPlanReady: "dry-run deploy plan ready",
    target: "Target",
    feed: "High priority",
    heroTitle: "Profiles, sync, operation, and guardrails in one local control surface.",
    heroBody: "Feature names stay engineering-oriented. Fixture mode is locked by default and does not touch real Claude Code or Codex config.",
    phaseStatus: "Local-first agent operations",
  },
} satisfies Record<Locale, Record<string, string>>;

function label(locale: Locale, item: NavItem) {
  return locale === "zh-CN" ? item.zh : item.en;
}

function viewLabel(locale: Locale, viewId: ViewId) {
  const item = viewLabels[viewId];
  return locale === "zh-CN" ? item.zh : item.en;
}

function isNavSelected(item: NavItem, activeView: ViewId) {
  return item.id === activeView || Boolean(item.matches?.includes(activeView));
}

function secondaryViewsFor(activeView: ViewId): ViewId[] {
  if (activeView === "discover" || activeView === "profiles" || activeView === "settings") {
    return ["discover", "profiles", "settings"];
  }
  if (activeView === "sync" || activeView === "guard") {
    return ["sync", "guard"];
  }
  if (activeView === "usage" || activeView === "insights") {
    return ["usage", "insights"];
  }
  return [activeView];
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem("harnessdeck.locale");
    return saved === "en-US" ? "en-US" : "zh-CN";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("harnessdeck.theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [activeView, setActiveViewRaw] = useState<ViewId>("home");
  const scrollPositions = useRef<Partial<Record<ViewId, number>>>({});
  const contentRef = useRef<HTMLElement>(null);
  const setActiveView = useCallback((next: ViewId) => {
    if (contentRef.current) {
      scrollPositions.current[activeView] = contentRef.current.scrollTop;
    }
    setActiveViewRaw(next);
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPositions.current[next] ?? 0;
      }
    });
  }, [activeView]);
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
    const suppressWebKitContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", suppressWebKitContextMenu);
    return () => document.removeEventListener("contextmenu", suppressWebKitContextMenu);
  }, []);

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
    return viewLabel(locale, activeView);
  }, [activeView, locale]);
  const secondaryViews = useMemo(() => secondaryViewsFor(activeView), [activeView]);

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

  const isMenuPanelWindow = new URLSearchParams(window.location.search).get("panel") === "1";
  const selectedProfileName = selectedProfile?.name ?? t.activeProfile;
  const runDryRun = async () => {
    setActiveView("sync");
    await confirmDryRun();
  };
  const openWorkbench = () => {
    setActiveView("home");
    void openWorkbenchWindow();
  };
  const switchProfile = () => setActiveView("profiles");

  useEffect(() => {
    const handleNativeShortcut = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        if (activeView !== "home") {
          event.preventDefault();
          setActiveView("home");
        }
        return;
      }

      if (!event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }

      if (event.key === ",") {
        event.preventDefault();
        setActiveView("settings");
        return;
      }

      const navIndex = Number(event.key) - 1;
      if (!event.shiftKey && navItems[navIndex]) {
        event.preventDefault();
        setActiveView(navItems[navIndex].id);
      }
    };

    window.addEventListener("keydown", handleNativeShortcut);
    return () => window.removeEventListener("keydown", handleNativeShortcut);
  }, [activeView]);

  if (isMenuPanelWindow) {
    return (
      <div className="panel-shell" data-theme={theme}>
        <MenuBarPanel
          highPriorityFeed={highPriorityFeed}
          locale={locale}
          manifest={manifest}
          onOpenWorkbench={openWorkbench}
          onRunDryRun={runDryRun}
          onSwitchProfile={switchProfile}
          selectedProfileName={selectedProfileName}
          selectedTargetKind={selectedTargetKind}
          standalone
          t={t}
          usageSummary={usageSummary}
        />
      </div>
    );
  }

  return (
    <div className="app-shell native-status-app" data-theme={theme} data-testid="app-shell">
      <section className="native-window" aria-label={t.workbenchTitle}>
        <header className="native-titlebar">
          <TrafficLights />
          <nav className="segmented-nav" aria-label="Workbench views">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = isNavSelected(item, activeView);
              return (
                <button
                  key={item.id}
                  aria-label={label(locale, item)}
                  aria-current={selected ? "page" : undefined}
                  className={selected ? "segment active" : "segment"}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label(locale, item)}</span>
                </button>
              );
            })}
          </nav>
          <div className="titlebar-actions">
            <button
              type="button"
              className="toolbar-button"
              onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
            >
              <Languages size={16} aria-hidden="true" />
              <span>{t.switchLanguage}</span>
            </button>
            <button type="button" className="toolbar-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <SunMedium size={16} aria-hidden="true" />}
              <span>{theme === "light" ? t.switchThemeDark : t.switchThemeLight}</span>
            </button>
          </div>
        </header>

        <main className="native-content" ref={contentRef}>
          <section className="status-header">
            <div className="health-lockup">
              <ProductMark />
              <div>
                <div className="score-line">
                  <strong>90</strong>
                  <span>{t.nativePressure}</span>
                </div>
                <p>{t.nativeStatusTitle}</p>
              </div>
            </div>
            <div className="status-chips" aria-label={t.rewritePlan}>
              <span>{t.localFirst}</span>
              <span>{t.fixture}</span>
              <span>{t.phaseZero}</span>
              <span>Keychain</span>
            </div>
          </section>

          {activeView === "home" ? (
            <NativeStatusDashboard
              highPriorityFeed={highPriorityFeed}
              locale={locale}
              manifest={manifest}
              onOpenWorkbench={openWorkbench}
              onRunDryRun={runDryRun}
              onSelectView={setActiveView}
              selectedProfileName={selectedProfileName}
              selectedTargetKind={selectedTargetKind}
              t={t}
              usageSummary={usageSummary}
              wakeSummary={wakeSummary}
            />
          ) : (
            <section className="detail-workspace">
              <div className="detail-titlebar">
                <div>
                  <span>{activeTitle}</span>
                  <strong>{selectedProfileName}</strong>
                </div>
                {secondaryViews.length > 1 ? (
                  <div className="context-tabs" aria-label="Section views">
                    {secondaryViews.map((viewId) => (
                      <button
                        key={viewId}
                        aria-current={viewId === activeView ? "page" : undefined}
                        className={viewId === activeView ? "context-tab active" : "context-tab"}
                        type="button"
                        onClick={() => setActiveView(viewId)}
                      >
                        {viewLabel(locale, viewId)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="status-pill">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Dry-run
                  </span>
                )}
              </div>

              <section className="view-panel prototype-view-panel">
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
                ) : activeView === "guard" ? (
                  <GuardView accountWorkspace={accountWorkspace} locale={locale} />
                ) : (
                  <SettingsView accountWorkspace={accountWorkspace} locale={locale} theme={theme} />
                )}
              </section>
            </section>
          )}
        </main>
      </section>
    </div>
  );
}

interface MenuBarPanelProps {
  highPriorityFeed: FeedItem[];
  locale: Locale;
  manifest: ManifestSummary | null;
  onOpenWorkbench: () => void;
  onRunDryRun: () => Promise<void>;
  onSwitchProfile: () => void;
  selectedProfileName: string;
  selectedTargetKind: TargetKind;
  standalone?: boolean;
  t: Record<string, string>;
  usageSummary: UsageSummary | null;
}

function MenuBarPanel({
  highPriorityFeed,
  locale,
  manifest,
  onOpenWorkbench,
  onRunDryRun,
  onSwitchProfile,
  selectedProfileName,
  selectedTargetKind,
  standalone = false,
  t,
  usageSummary,
}: MenuBarPanelProps) {
  const costMetric = usageSummary?.metrics.find((item) => item.id === "cost");
  const syncValue = manifest ? (locale === "zh-CN" ? "manifest 已写入" : "manifest written") : "93%";
  const burnMetric = usageSummary ? `$${usageSummary.burnRateUsdPerHour.toFixed(2)}/h` : "$0.82/h";
  const feedTitle = highPriorityFeed[0]?.title ?? (locale === "zh-CN" ? "暂无高优先事项" : "No high-priority items");
  const panelMetrics = [
    {
      icon: Layers,
      label: t.currentProfile,
      value: selectedProfileName,
      meta: `${selectedTargetKind} target`,
      tone: "blue",
      bars: [54, 62, 58, 71, 67, 78, 72],
    },
    {
      icon: Shuffle,
      label: t.syncStatus,
      value: syncValue,
      meta: manifest?.id ?? (locale === "zh-CN" ? "manifest 待生成" : "manifest pending"),
      tone: "green",
      bars: [44, 51, 65, 72, 77, 84, 93],
    },
    {
      icon: BarChart3,
      label: t.cost,
      value: costMetric ? `${costMetric.value}${costMetric.unit}` : "$4.82",
      meta: burnMetric,
      tone: "gold",
      bars: [25, 34, 48, 42, 55, 49, 58],
    },
    {
      icon: Zap,
      label: t.wake,
      value: t.awakeStandard,
      meta: locale === "zh-CN" ? "mock/system-safe" : "mock/system-safe",
      tone: "gold",
    },
  ];
  const focusMeta = locale === "zh-CN" ? "来自本地 feed，只显示摘要" : "Local feed summary only";

  return (
    <aside
      aria-label={t.menuPanel}
      className={standalone ? "menu-status-panel standalone" : "menu-status-panel"}
      data-testid={standalone ? "menu-panel-window" : undefined}
    >
      <MacChrome compact={standalone} status={standalone ? "Pinned" : "Live"} title={t.menuPanel} />

      <div className="panel-health">
        <div className="panel-score">
          <ProductMark compact />
          <strong>90</strong>
        </div>
        <div>
          <span>{t.nativeHealthLabel}</span>
          <p>{t.nativePressure}</p>
        </div>
      </div>

      <div className="mini-chips">
        <span>{t.localFirst}</span>
        <span>{t.fixture}</span>
        <span>Keychain</span>
        <span>{t.phaseZero}</span>
      </div>

      <button className="panel-search" type="button">
        <Search size={16} aria-hidden="true" />
        <span>{t.searchPlaceholder}</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="panel-status-list">
        {panelMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`panel-status-row ${metric.tone}`} key={metric.label}>
              <span>
                <Icon size={15} aria-hidden="true" />
                {metric.label}
              </span>
              <strong>{metric.value}</strong>
              <small>{metric.meta}</small>
            </article>
          );
        })}
      </div>

      <div className="panel-actions" aria-label={t.quickActions}>
        <button type="button" onClick={onOpenWorkbench}>
          <Gauge size={16} aria-hidden="true" />
          <span>{t.openWorkbench}</span>
        </button>
        <button type="button" onClick={() => void onRunDryRun()}>
          <Zap size={16} aria-hidden="true" />
          <span>{t.dryRun}</span>
        </button>
        <button type="button" onClick={onSwitchProfile}>
          <Layers size={16} aria-hidden="true" />
          <span>{t.switchProfile}</span>
        </button>
        <button type="button">
          <RotateCw size={16} aria-hidden="true" />
          <span>{t.refresh}</span>
        </button>
      </div>

      <section className="panel-safety-strip">
        <div>
          <span>{locale === "zh-CN" ? "安全边界" : "Safety boundary"}</span>
          <strong>{locale === "zh-CN" ? "真实写入关闭" : "Real writes blocked"}</strong>
        </div>
        <ShieldCheck size={24} aria-hidden="true" />
      </section>

      <section className="panel-focus-card">
        <div className="table-title">
          <span>{locale === "zh-CN" ? "下一步" : "Next"}</span>
          <strong>{highPriorityFeed.length || 1}</strong>
        </div>
        <strong>{feedTitle}</strong>
        <p>{focusMeta}</p>
      </section>
    </aside>
  );
}

interface NativeStatusDashboardProps {
  highPriorityFeed: FeedItem[];
  locale: Locale;
  manifest: ManifestSummary | null;
  onOpenWorkbench: () => void;
  onRunDryRun: () => Promise<void>;
  onSelectView: (viewId: ViewId) => void;
  selectedProfileName: string;
  selectedTargetKind: TargetKind;
  t: Record<string, string>;
  usageSummary: UsageSummary | null;
  wakeSummary: WakeControlSummary | null;
}

function NativeStatusDashboard({
  highPriorityFeed,
  locale,
  manifest,
  onOpenWorkbench,
  onRunDryRun,
  onSelectView,
  selectedProfileName,
  selectedTargetKind,
  t,
  usageSummary,
  wakeSummary,
}: NativeStatusDashboardProps) {
  const costMetric = usageSummary?.metrics.find((metric) => metric.id === "cost");
  const nextAction = highPriorityFeed[0]?.title ?? (locale === "zh-CN" ? "先运行 dry-run，确认 Claude / Codex 同步计划" : "Run dry-run to confirm the Claude / Codex sync plan");
  const cards = [
    {
      icon: Search,
      label: locale === "zh-CN" ? "发现最佳实践" : "Discover",
      value: "7",
      unit: locale === "zh-CN" ? "源" : "src",
      badge: "Registry",
      meta: locale === "zh-CN" ? "本地 registry 与 find-best-skill 推荐" : "Local registry and find-best-skill recommendations",
      tone: "blue",
      bars: [38, 48, 52, 61, 68, 74, 82],
      actionLabel: locale === "zh-CN" ? "查看推荐" : "Review",
      onAction: () => onSelectView("discover"),
    },
    {
      icon: Layers,
      label: locale === "zh-CN" ? "配置集" : "Profiles",
      value: "42",
      unit: "rules",
      badge: selectedProfileName,
      meta: locale === "zh-CN" ? "维护 Harness Profile、skills、MCP 引用" : "Harness Profile, skills, and MCP references",
      tone: "purple",
      bars: [56, 63, 69, 72, 76, 74, 78],
      actionLabel: locale === "zh-CN" ? "编辑配置集" : "Edit",
      onAction: () => onSelectView("profiles"),
    },
    {
      icon: Shuffle,
      label: locale === "zh-CN" ? "安全同步" : "Safe Sync",
      value: manifest ? "Done" : locale === "zh-CN" ? "就绪" : "Ready",
      unit: "",
      badge: selectedTargetKind,
      meta: locale === "zh-CN" ? "Claude Code / Codex 走 dry-run、diff、manifest" : "Claude Code / Codex via dry-run, diff, and manifest",
      tone: "teal",
      bars: [44, 51, 65, 72, 77, 84, 93],
      actionLabel: t.dryRun,
      onAction: onRunDryRun,
    },
    {
      icon: TerminalSquare,
      label: locale === "zh-CN" ? "日常运行" : "Operate",
      value: wakeSummary?.currentState.confirmed ? "Exp" : locale === "zh-CN" ? "标准" : "Std",
      unit: "",
      badge: t.wake,
      meta: locale === "zh-CN" ? "菜单栏快捷动作、防睡、工作台入口" : "Menu bar actions, wake control, workbench entry",
      tone: "gold",
      bars: [38, 38, 41, 40, 42, 39],
      actionLabel: locale === "zh-CN" ? "打开面板" : "Open panel",
      onAction: () => onSelectView("operate"),
    },
    {
      icon: BarChart3,
      label: locale === "zh-CN" ? "用量与成本" : "Usage",
      value: costMetric ? costMetric.value : "$4.82",
      unit: costMetric?.unit ?? "",
      badge: "5h",
      meta: locale === "zh-CN" ? "token、成本、时长、置信度一起展示" : "Tokens, cost, duration, and confidence",
      tone: "blue",
      bars: [25, 34, 48, 42, 55, 49, 58],
      actionLabel: locale === "zh-CN" ? "看异常" : "Inspect",
      onAction: () => onSelectView("usage"),
    },
    {
      icon: ShieldCheck,
      label: locale === "zh-CN" ? "守护边界" : "Guard",
      value: "100",
      unit: "%",
      badge: "Keychain",
      meta: locale === "zh-CN" ? "默认不上传 prompt、源码、secret 或原始配置" : "No prompts, source, secrets, or raw config uploaded by default",
      tone: "teal",
      bars: [100, 100, 100, 100, 100, 100],
      actionLabel: locale === "zh-CN" ? "审计边界" : "Audit",
      onAction: () => onSelectView("guard"),
    },
  ];
  const moduleRows = [
    {
      name: locale === "zh-CN" ? "Discover 最佳实践" : "Discover practices",
      pid: "01",
      cpu: "7",
      memory: "Registry",
      status: locale === "zh-CN" ? "可用" : "Ready",
    },
    {
      name: locale === "zh-CN" ? "Profile 生成与维护" : "Profile authoring",
      pid: "02",
      cpu: "42",
      memory: selectedProfileName,
      status: locale === "zh-CN" ? "当前" : "Active",
    },
    {
      name: locale === "zh-CN" ? "Claude / Codex 安全同步" : "Claude / Codex safe sync",
      pid: "03",
      cpu: manifest ? "Done" : "Ready",
      memory: selectedTargetKind,
      status: "Dry-run",
    },
    {
      name: locale === "zh-CN" ? "菜单栏操作中心" : "Menu bar control",
      pid: "04",
      cpu: t.awakeStandard,
      memory: t.quickActions,
      status: locale === "zh-CN" ? "可操作" : "Actionable",
    },
    {
      name: locale === "zh-CN" ? "Usage 成本观测" : "Usage intelligence",
      pid: "05",
      cpu: costMetric ? `${costMetric.value}${costMetric.unit}` : "$4.82",
      memory: "LocalLog",
      status: locale === "zh-CN" ? "估算" : "Estimated",
    },
    {
      name: locale === "zh-CN" ? "Improve 建议队列" : "Improve queue",
      pid: "06",
      cpu: String(highPriorityFeed.length || 1),
      memory: highPriorityFeed[0]?.title ?? "Profile drift",
      status: locale === "zh-CN" ? "高优先" : "High",
    },
  ];
  const improvements = [
    {
      label: locale === "zh-CN" ? "已清理" : "Cleared",
      value: manifest ? "1" : "0",
      detail: locale === "zh-CN" ? "dry-run manifest" : "dry-run manifest",
    },
    {
      label: locale === "zh-CN" ? "待授权" : "Needs auth",
      value: "2",
      detail: "Codex / Claude Code",
    },
    {
      label: locale === "zh-CN" ? "建议" : "Suggestions",
      value: String(highPriorityFeed.length || 3),
      detail: highPriorityFeed[0]?.title ?? "Profile drift",
    },
  ];
  const safetyChecks = [
    locale === "zh-CN" ? "真实写入关闭" : "Real writes blocked",
    locale === "zh-CN" ? "先生成 plan / diff" : "Plan and diff first",
    locale === "zh-CN" ? "Keychain 只存引用" : "Keychain references only",
    locale === "zh-CN" ? "保留 backup / audit" : "Backup and audit retained",
  ];

  return (
    <div className="status-dashboard">
      <section className="hero-health-card command-brief">
        <div>
          <div className="metric-label">
            <Sparkles size={18} aria-hidden="true" />
            <span>{locale === "zh-CN" ? "今日工作台" : "Today"}</span>
          </div>
          <div className="command-score">
            <strong>90</strong>
            <span>{t.nativePressure}</span>
          </div>
          <p>{nextAction}</p>
          <div className="hero-meta">
            <span>{selectedProfileName}</span>
            <span>{costMetric ? `${costMetric.value}${costMetric.unit}` : "$4.82"}</span>
            <span>{manifest ? "manifest" : "fixture"}</span>
          </div>
          <div className="hero-actions">
            <button className="primary-action compact" type="button" onClick={() => void onRunDryRun()}>
              <Zap size={17} aria-hidden="true" />
              <span>{t.dryRun}</span>
            </button>
            <button className="secondary-action" type="button" onClick={onOpenWorkbench}>
              <Gauge size={17} aria-hidden="true" />
              <span>{t.openWorkbench}</span>
            </button>
          </div>
        </div>
        <div className="phase-stack" aria-label={t.lifecycle}>
          <span>Discover</span>
          <span>Profile</span>
          <span>Sync</span>
          <span>Operate</span>
          <span>Improve</span>
        </div>
      </section>

      <section className="wide-status-card safety-card command-safety">
        <div>
          <div className="metric-label">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>{locale === "zh-CN" ? "安全边界" : "Safety boundary"}</span>
          </div>
          <strong>100%</strong>
          <p>
            {locale === "zh-CN"
              ? "默认 fixture/mock mode；任何同步都先生成 plan、diff、backup、manifest，并记录 audit trail。"
              : "Fixture/mock mode stays default; every sync starts with plan, diff, backup, manifest, and audit trail."}
          </p>
        </div>
        <div className="safety-checks">
          {safetyChecks.map((item) => (
            <span key={item}>
              <CheckCircle2 size={15} aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="metric-grid workflow-action-grid" aria-label={t.statusWorkbench}>
        {cards.map((card) => (
          <NativeMetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="process-card">
        <div className="table-title">
          <span>{t.moduleTable}</span>
          <strong>6</strong>
        </div>
        <div className="process-rows">
          {moduleRows.map((row) => (
            <div className="process-row" key={row.name}>
              <strong>{row.name}</strong>
              <span>{row.pid}</span>
              <span>{row.cpu}</span>
              <span>{row.memory}</span>
              <em>{row.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="cleanup-card">
        <div className="table-title">
          <span>{t.improvementQueue}</span>
          <button type="button" onClick={onOpenWorkbench}>
            {t.openWorkbench}
            <ChevronRightIcon />
          </button>
        </div>
        <div className="cleanup-grid">
          {improvements.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function NativeMetricCard({
  badge,
  bars,
  icon: Icon,
  label,
  meta,
  actionLabel,
  onAction,
  tone,
  unit,
  value,
}: {
  actionLabel?: string;
  badge: string;
  bars: number[];
  icon: typeof Home;
  label: string;
  meta: string;
  onAction?: () => Promise<void> | void;
  tone: string;
  unit: string;
  value: string;
}) {
  return (
    <article className={`native-metric-card ${tone}`}>
      <div className="metric-head">
        <span>
          <Icon size={16} aria-hidden="true" />
          {label}
        </span>
        <em>{badge}</em>
      </div>
      <div className="metric-value">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <MiniBars values={bars} />
      <small>{meta}</small>
      {actionLabel ? (
        <button className="metric-card-action" type="button" onClick={() => void onAction?.()}>
          <span>{actionLabel}</span>
          <ChevronRightIcon />
        </button>
      ) : null}
    </article>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 100);
  return (
    <div className="mini-bars" aria-hidden="true">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(18, (value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function ChevronRightIcon() {
  return <span className="chevron-mark" aria-hidden="true" />;
}

function MacChrome({ compact = false, status, title }: { compact?: boolean; status?: string; title: string }) {
  return (
    <div className={compact ? "mac-chrome compact" : "mac-chrome"}>
      {compact ? <div className="panel-grabber" aria-hidden="true" /> : <TrafficLights />}
      <span>{title}</span>
      {status ? <em>{status}</em> : null}
    </div>
  );
}

function TrafficLights() {
  return (
    <div className="traffic-lights" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function ProductMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "product-mark compact" : "product-mark"} aria-hidden="true">
      <Command className="product-mark-core" size={28} />
      <span className="product-mark-badge shield">
        <ShieldCheck size={13} />
      </span>
      {compact ? null : (
        <span className="product-mark-badge cable">
          <Cable size={13} />
        </span>
      )}
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
        {highPriorityFeed[0] ? <span className="status-pill">High priority</span> : null}
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

function GuardView({ accountWorkspace, locale }: { accountWorkspace: AccountWorkspace | null; locale: Locale }) {
  return (
    <div className="guard-workbench">
      <section className="guard-hero">
        <div>
          <h3>{locale === "zh-CN" ? "守护策略" : "Guard Policy"}</h3>
          <p>{locale === "zh-CN" ? "所有真实写入保持关闭；任何破坏性动作都需要 dry-run、manifest、backup 和显式确认。" : "All real writes stay disabled; destructive actions require dry-run, manifest, backup, and explicit confirmation."}</p>
        </div>
        <span className="status-pill">real writes blocked</span>
      </section>

      <div className="guard-grid">
        <article>
          <strong>Privacy</strong>
          <span>不上传 prompt、源码、密钥或本地配置</span>
        </article>
        <article>
          <strong>Keychain</strong>
          <code>{accountWorkspace?.keychainRef.reference ?? "keychain://HarnessDeck/accounts/openai"}</code>
        </article>
        <article>
          <strong>Backup</strong>
          <span>backup required before real write</span>
        </article>
        <article>
          <strong>Manifest</strong>
          <span>dry-run manifest required before deploy</span>
        </article>
      </div>
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
