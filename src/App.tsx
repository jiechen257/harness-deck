import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MenuBarPanel } from "./components/menubar/MenuBarPanel";
import { HarnessLogo } from "./components/shared/HarnessLogo";
import { DiscoverView } from "./components/views/DiscoverView";
import { GuardView } from "./components/views/GuardView";
import { HomeView } from "./components/views/HomeView";
import { InsightsView } from "./components/views/InsightsView";
import { OperateView } from "./components/views/OperateView";
import { ProfileView } from "./components/views/ProfileView";
import { SettingsView } from "./components/views/SettingsView";
import { SyncView } from "./components/views/SyncView";
import { UsageView } from "./components/views/UsageView";
import { copy } from "./constants/copy";
import { isNavSelected, navItems, navLabel, secondaryViewsFor, viewLabel } from "./constants/navigation";
import type { ViewId } from "./constants/types";
import { useLocale } from "./hooks/useLocale";
import { useTheme } from "./hooks/useTheme";
import {
  confirmDryRunDeploy,
  discoverTargets,
  findBestSkill,
  generateDeployPlan,
  getAccountWorkspace,
  getAppStatus,
  getSyncGovernance,
  getUsageSummary,
  getWakeControl,
  listFeedItems,
  listHighPriorityFeed,
  listInsights,
  listLocalSkills,
  listProfiles,
  listRegistryTemplates,
  listTargets,
  openWorkbench as openWorkbenchWindow,
  requestWakeMode,
} from "./lib/api";
import type {
  AccountWorkspace,
  AppStatus,
  DeployPlan,
  FeedItem,
  FindBestSkillResult,
  Insight,
  LocalSkillEntry,
  ManifestSummary,
  ProfileSummary,
  RegistrySkillTemplate,
  SyncGovernance,
  TargetDiscoverySummary,
  TargetKind,
  TargetSummary,
  UsageSummary,
  WakeControlSummary,
  WakeSession,
} from "./lib/types";

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function App() {
  const [locale, setLocale] = useLocale();
  const [theme, setTheme] = useTheme();
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
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
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
  const [localSkills, setLocalSkills] = useState<LocalSkillEntry[]>([]);
  const [skillRecommendation, setSkillRecommendation] = useState<FindBestSkillResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [highPriorityFeed, setHighPriorityFeed] = useState<FeedItem[]>([]);
  const [wakeSummary, setWakeSummary] = useState<WakeControlSummary | null>(null);
  const [confirmedWakeSession, setConfirmedWakeSession] = useState<WakeSession | null>(null);
  const [manifest, setManifest] = useState<ManifestSummary | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const t = copy[locale];

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
    if (!brandMenuOpen) return;
    const close = () => setBrandMenuOpen(false);
    window.addEventListener("click", close, { once: true });
    return () => window.removeEventListener("click", close);
  }, [brandMenuOpen]);

  useEffect(() => {
    void Promise.all([
      listProfiles(),
      listTargets(),
      getAccountWorkspace(),
      getUsageSummary(),
      listRegistryTemplates(),
      listLocalSkills(),
      findBestSkill("sync Claude Code and Codex rules safely", false),
      listInsights(),
      listFeedItems(),
      listHighPriorityFeed(),
      getWakeControl(),
      getAppStatus(),
    ]).then(
      ([
        nextProfiles,
        nextTargets,
        nextAccountWorkspace,
        nextUsageSummary,
        nextRegistryTemplates,
        nextLocalSkills,
        nextSkillRecommendation,
        nextInsights,
        nextFeedItems,
        nextHighPriorityFeed,
        nextWakeSummary,
        nextAppStatus,
      ]) => {
        setProfiles(nextProfiles);
        setTargets(nextTargets);
        setAccountWorkspace(nextAccountWorkspace);
        setUsageSummary(nextUsageSummary);
        setRegistryTemplates(nextRegistryTemplates);
        setLocalSkills(nextLocalSkills);
        setSkillRecommendation(nextSkillRecommendation);
        setInsights(nextInsights);
        setFeedItems(nextFeedItems);
        setHighPriorityFeed(nextHighPriorityFeed);
        setWakeSummary(nextWakeSummary);
        setAppStatus(nextAppStatus);
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

  const secondaryViews = useMemo(() => secondaryViewsFor(activeView), [activeView]);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  const confirmDryRun = async () => {
    if (!deployPlan) return;
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
  const healthScore = appStatus?.healthScore ?? 0;
  const runDryRun = async () => {
    setActiveView("sync");
    await confirmDryRun();
  };
  const openWorkbench = () => {
    setActiveView("home");
    void openWorkbenchWindow();
  };
  const switchProfile = () => setActiveView("profiles");

  const refreshData = useCallback(() => {
    void Promise.all([
      getAccountWorkspace(),
      getUsageSummary(),
      listHighPriorityFeed(),
      getAppStatus(),
      listProfiles(),
    ]).then(([nextAW, nextUsage, nextFeed, nextStatus, nextProfiles]) => {
      setAccountWorkspace(nextAW);
      setUsageSummary(nextUsage);
      setHighPriorityFeed(nextFeed);
      setAppStatus(nextStatus);
      setProfiles(nextProfiles);
    });
  }, []);

  useEffect(() => {
    const handleNativeShortcut = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (event.key === "Escape") {
        if (activeView !== "home") {
          event.preventDefault();
          setActiveView("home");
        }
        return;
      }

      if (!event.metaKey || event.altKey || event.ctrlKey) return;

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
          healthScore={healthScore}
          highPriorityFeed={highPriorityFeed}
          locale={locale}
          manifest={manifest}
          onOpenWorkbench={openWorkbench}
          onRefresh={refreshData}
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
        <header className="native-titlebar" data-tauri-drag-region="">
          <nav className="segmented-nav" aria-label="Workbench views" data-tauri-drag-region="">
            <div className="titlebar-brand-wrapper">
              <button
                type="button"
                className="titlebar-brand"
                aria-expanded={brandMenuOpen}
                onClick={(e) => { e.stopPropagation(); setBrandMenuOpen(!brandMenuOpen); }}
              >
                <HarnessLogo size={28} />
              </button>
              {brandMenuOpen ? (
                <div className="brand-dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("settings"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "设置" : "Settings"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("guard"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "守护策略" : "Guard Policy"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("usage"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "用量统计" : "Usage Stats"}
                  </button>
                  <hr />
                  <button type="button" role="menuitem" onClick={() => { setLocale(locale === "zh-CN" ? "en-US" : "zh-CN"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "切换到 English" : "切换到中文"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setTheme(theme === "light" ? "dark" : "light"); setBrandMenuOpen(false); }}>
                    {theme === "light" ? (locale === "zh-CN" ? "深色模式" : "Dark Mode") : (locale === "zh-CN" ? "浅色模式" : "Light Mode")}
                  </button>
                  <hr />
                  <button type="button" role="menuitem" onClick={() => setBrandMenuOpen(false)}>
                    {locale === "zh-CN" ? "关于 HarnessDeck" : "About HarnessDeck"}
                  </button>
                </div>
              ) : null}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = isNavSelected(item, activeView);
              return (
                <button
                  key={item.id}
                  aria-label={navLabel(locale, item)}
                  aria-current={selected ? "page" : undefined}
                  className={selected ? "segment active" : "segment"}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{navLabel(locale, item)}</span>
                </button>
              );
            })}
          </nav>
        </header>

        <main className="native-content" ref={contentRef}>
          {activeView === "home" ? (
            <HomeView
              healthScore={healthScore}
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
            <section className={secondaryViews.length > 1 ? "detail-workspace has-sidebar" : "detail-workspace"}>
              {secondaryViews.length > 1 ? (
                <nav className="detail-sidebar" aria-label="Section views">
                  {secondaryViews.map((viewId) => (
                    <button
                      key={viewId}
                      aria-current={viewId === activeView ? "page" : undefined}
                      className={viewId === activeView ? "sidebar-tab active" : "sidebar-tab"}
                      type="button"
                      onClick={() => setActiveView(viewId)}
                    >
                      {viewLabel(locale, viewId)}
                    </button>
                  ))}
                </nav>
              ) : null}

              <section className="view-panel">
                {activeView === "discover" ? (
                  <DiscoverView locale={locale} localSkills={localSkills} registryTemplates={registryTemplates} skillRecommendation={skillRecommendation} />
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
