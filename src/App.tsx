import { getCurrentWindow } from "@tauri-apps/api/window";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MenuBarPanel } from "./components/menubar/MenuBarPanel";
import { HarnessLogo } from "./components/shared/HarnessLogo";
import { ApplySyncView } from "./components/views/ApplySyncView";
import { HomeView } from "./components/views/HomeView";
import { LocalReviewView } from "./components/views/LocalReviewView";
import { OperationsView } from "./components/views/OperationsView";
import { PracticeLibraryView } from "./components/views/PracticeLibraryView";
import { SettingsView } from "./components/views/SettingsView";
import { copy } from "./constants/copy";
import { isNavSelected, navItems, navLabel } from "./constants/navigation";
import type { ViewId } from "./constants/types";
import { useLocale } from "./hooks/useLocale";
import { useTheme } from "./hooks/useTheme";
import {
  getAppStatus,
  getLoopSummary,
  openWorkbench as openWorkbenchWindow,
} from "./lib/api";
import type { AppStatus, LoopSection, LoopSummary } from "./lib/types";

const OPEN_VIEW_KEY = "hone:open-view";

const navCaptions = {
  home: { zh: "闭环状态", en: "Loop status" },
  library: { zh: "信号 · 实践 · 资产", en: "Signals · Practices · Assets" },
  apply: { zh: "投射 · 采纳 · 回滚", en: "Projection · Adopt · Rollback" },
  review: { zh: "偏移 · 证据 · 建议", en: "Drift · Evidence · Advice" },
  operations: { zh: "脚本预览与确认", en: "Script preview and confirm" },
  settings: { zh: "注册表与授权", en: "Registry and authorization" },
} satisfies Record<ViewId, { zh: string; en: string }>;

const navSectionMap = {
  home: null,
  library: "signals",
  apply: "assets",
  review: "review",
  operations: "operations",
  settings: null,
} satisfies Record<ViewId, string | null>;

function sectionById(summary: LoopSummary | null, id: string): LoopSection | null {
  return summary?.sections.find((section) => section.id === id) ?? null;
}

function navBadge(summary: LoopSummary | null, viewId: ViewId, healthScore: number) {
  if (viewId === "home") return `${healthScore}%`;
  if (viewId === "settings") return "5";
  const sectionId = navSectionMap[viewId];
  if (!sectionId) return "";
  return String(sectionById(summary, sectionId)?.count ?? 0);
}

function badgeTone(viewId: ViewId) {
  if (viewId === "home" || viewId === "library") return "good";
  if (viewId === "apply" || viewId === "review") return "warn";
  return "";
}

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
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [loopSummary, setLoopSummary] = useState<LoopSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const t = copy[locale];
  const zh = locale === "zh-CN";

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

  const loadShellData = useCallback(() => {
    return Promise.all([
      getAppStatus().then(setAppStatus),
      getLoopSummary().then(setLoopSummary),
    ]);
  }, []);

  useEffect(() => {
    void loadShellData();
  }, [loadShellData]);

  const healthScore = loopSummary?.healthScore ?? appStatus?.healthScore ?? 0;
  const openWorkbench = () => {
    setActiveView("home");
    void openWorkbenchWindow();
  };

  const openWorkbenchView = useCallback((view: ViewId) => {
    window.localStorage.setItem(OPEN_VIEW_KEY, view);
    setActiveView(view);
    void openWorkbenchWindow();
  }, [setActiveView]);

  const refreshData = useCallback(() => {
    setRefreshing(true);
    void loadShellData()
      .finally(() => setRefreshing(false));
  }, [loadShellData]);

  useEffect(() => {
    const applyPendingView = () => {
      const pending = window.localStorage.getItem(OPEN_VIEW_KEY) as ViewId | null;
      if (pending && navItems.some((item) => item.id === pending)) {
        window.localStorage.removeItem(OPEN_VIEW_KEY);
        setActiveView(pending);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === OPEN_VIEW_KEY) applyPendingView();
    };
    applyPendingView();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", applyPendingView);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", applyPendingView);
    };
  }, [setActiveView]);

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

  const isMenuPanelWindow = new URLSearchParams(window.location.search).get("panel") === "1";

  useEffect(() => {
    document.documentElement.classList.toggle("panel-window-root", isMenuPanelWindow);
    document.body.classList.toggle("panel-window-body", isMenuPanelWindow);
    return () => {
      document.documentElement.classList.remove("panel-window-root");
      document.body.classList.remove("panel-window-body");
    };
  }, [isMenuPanelWindow]);

  if (isMenuPanelWindow) {
    return (
      <div className="panel-shell panel-shell-standalone" data-theme={theme}>
        <MenuBarPanel
          healthScore={healthScore}
          locale={locale}
          onRefresh={refreshData}
          onOpenWorkbench={openWorkbench}
          onOpenView={openWorkbenchView}
          refreshing={refreshing}
          standalone
        />
      </div>
    );
  }

  return (
    <div className="app-shell native-status-app command-deck-app" data-theme={theme} data-testid="app-shell">
      <main className="desktop workbench-command-deck" data-testid="workbench-shell">
        <aside className="rail" aria-label={zh ? "Hone 工作台导航" : "Hone workbench navigation"}>
          <header
            className="rail-head"
            onMouseDown={(e) => {
              if (e.buttons === 1 && !(e.target as HTMLElement).closest("button, a, input, select, [role='menu']")) {
                e.preventDefault();
                void getCurrentWindow().startDragging();
              }
            }}
          >
            <div className="titlebar-brand-wrapper">
              <button
                type="button"
                className="titlebar-brand rail-brand-button"
                aria-expanded={brandMenuOpen}
                onClick={(e) => { e.stopPropagation(); setBrandMenuOpen(!brandMenuOpen); }}
              >
                <span className="brand-mark"><HarnessLogo size={32} /></span>
                <span>
                  <span className="brand-name">Hone</span>
                  <span className="rail-subtitle">{zh ? "Practice Shard · 本地实践运营台" : "Practice Shard · Local operations"}</span>
                </span>
              </button>
              {brandMenuOpen ? (
                <div className="brand-dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("settings"); setBrandMenuOpen(false); }}>
                    {zh ? "设置" : "Settings"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("review"); setBrandMenuOpen(false); }}>
                    {zh ? "本地评审" : "Local Review"}
                  </button>
                  <hr />
                  <button type="button" role="menuitem" onClick={() => { setLocale(zh ? "en-US" : "zh-CN"); setBrandMenuOpen(false); }}>
                    {zh ? "切换到 English" : "切换到中文"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setTheme(theme === "light" ? "dark" : "light"); setBrandMenuOpen(false); }}>
                    {theme === "light" ? (zh ? "深色模式" : "Dark Mode") : (zh ? "浅色模式" : "Light Mode")}
                  </button>
                  <hr />
                  <button type="button" role="menuitem" onClick={() => setBrandMenuOpen(false)}>
                    {zh ? "关于 Hone" : "About Hone"}
                  </button>
                </div>
              ) : null}
            </div>
          </header>
          <div className="rail-body">
            <nav className="loop-map" aria-label="Workbench views">
              {navItems.map((item, index) => {
                const selected = isNavSelected(item, activeView);
                const badge = navBadge(loopSummary, item.id, healthScore);
                const tone = badgeTone(item.id);
                return (
                  <button
                    key={item.id}
                    aria-label={navLabel(locale, item)}
                    aria-current={selected ? "page" : undefined}
                    className={selected ? "nav-item active" : "nav-item"}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                  >
                    <span className="node">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{navLabel(locale, item)}</strong>
                      <span className="caption">{zh ? navCaptions[item.id].zh : navCaptions[item.id].en}</span>
                    </div>
                    <span className={tone ? `badge ${tone}` : "badge"}>{badge}</span>
                  </button>
                );
              })}
            </nav>
            <section className="rail-card">
              <div className="brand-stone-card">
                <strong>{zh ? "工具石工作流" : "Practice shard workflow"}</strong>
                <div className="stone-line">
                  <span className="stone-logo"><HarnessLogo size={28} /></span>
                  <span>{zh ? "信号被切面化、验证、投射，最后沉淀成本地资产。" : "Signals are sliced, verified, projected, then settled as local assets."}</span>
                </div>
              </div>
              <strong>{zh ? "快捷动作" : "Quick actions"}</strong>
              <button className="quick-button" type="button" onClick={() => setActiveView("library")}><span>{zh ? "规范化信号" : "Normalize signals"}</span><span>→</span></button>
              <button className="quick-button" type="button" onClick={() => setActiveView("apply")}><span>{zh ? "预览投射计划" : "Preview projection"}</span><span>→</span></button>
              <button className="quick-button" type="button" onClick={() => setActiveView("review")}><span>{zh ? "查看证据链" : "View evidence"}</span><span>→</span></button>
            </section>
          </div>
          <footer className="rail-head rail-foot">
            <span className="pill good">{loopSummary?.fixtureMode ? (zh ? "Fixture 实时聚合" : "Fixture aggregation") : (zh ? "SQLite 实时聚合" : "SQLite aggregation")}</span>
            <div className="caption">{zh ? "hone.db · 审计已启用 · 所有写入需确认" : "hone.db · audit enabled · every write needs confirmation"}</div>
          </footer>
        </aside>

        <section className="stage" aria-label={t.workbenchTitle}>
          <header className="stage-head">
            <label className="search">
              <Search size={15} aria-hidden="true" />
              <input aria-label={zh ? "搜索实践运营台" : "Search operations desk"} placeholder={zh ? "搜索信号、实践、资产或审计记录 ⌘K" : "Search signals, practices, assets, or audit records ⌘K"} />
            </label>
            <div className="head-actions" aria-label={zh ? "工作台工具" : "Workbench tools"}>
              <button className="action" type="button" disabled={refreshing} onClick={refreshData}>{zh ? "刷新信号" : "Refresh signals"}</button>
              <button className="action primary" type="button" onClick={() => setActiveView("library")}>{zh ? "打开命令面板" : "Open command panel"}</button>
            </div>
          </header>
          <main className="canvas native-content" ref={contentRef}>
            {activeView === "home" ? (
              <HomeView
                healthScore={healthScore}
                locale={locale}
                onSelectView={setActiveView}
                t={t}
              />
            ) : (
              <section className="detail-workspace">
                <section className="view-panel">
                  {activeView === "library" ? (
                    <PracticeLibraryView locale={locale} onSelectView={setActiveView} />
                  ) : activeView === "apply" ? (
                    <ApplySyncView locale={locale} />
                  ) : activeView === "review" ? (
                    <LocalReviewView locale={locale} />
                  ) : activeView === "operations" ? (
                    <OperationsView locale={locale} />
                  ) : (
                    <SettingsView locale={locale} theme={theme} />
                  )}
                </section>
              </section>
            )}
          </main>
        </section>

        <aside className="inspector" aria-label={zh ? "证据抽屉" : "Evidence drawer"}>
          <header className="inspector-head">
            <h2>{zh ? "证据抽屉" : "Evidence Drawer"}</h2>
            <p>{zh ? "当前视图的风险、目标、审计和可执行动作。" : "Risks, targets, audits, and executable actions for the current view."}</p>
          </header>
          <div className="inspector-body">
            <section className="drawer-card">
              <div className="drawer-title"><strong>{zh ? "目标健康度" : "Target Health"}</strong><span className="badge warn">{loopSummary?.targets.length ?? 2}</span></div>
              {(loopSummary?.targets ?? [
                { name: "Claude Code", detail: "0 browser fixture projections", score: 82, status: "fixture" },
                { name: "Codex", detail: "0 browser fixture projections", score: 78, status: "fixture" },
              ]).map((target) => (
                <div className="list-row target-row" key={target.name}>
                  <span className="icon">{target.name === "Claude Code" ? "CC" : "CX"}</span>
                  <div><strong>{target.name}</strong><span className="caption">{target.detail}</span></div>
                  <span className="badge warn">{target.score}%</span>
                </div>
              ))}
            </section>
            <section className="drawer-card">
              <div className="drawer-title"><strong>{zh ? "最近审计" : "Recent Audit"}</strong><button className="ghost-button" type="button" onClick={() => setActiveView("review")}>{zh ? "查看全部" : "View all"}</button></div>
              {(loopSummary?.recentAudits ?? []).slice(0, 3).map((audit) => (
                <div className="audit-row" key={audit.id}>
                  <span className={`badge ${audit.outcome === "success" ? "good" : "warn"}`}>{audit.outcome === "success" ? "OK" : "!"}</span>
                  <div><strong>{audit.eventType}</strong><span className="caption">{audit.detail ?? audit.entityType ?? ""}</span></div>
                </div>
              ))}
            </section>
            <section className="drawer-card">
              <div className="drawer-title"><strong>{zh ? "安全边界" : "Safety Boundary"}</strong><span className="badge">5</span></div>
              <p>{zh ? "外部信号、写入投射和脚本执行默认关闭；投射和运维动作必须先预览、再确认、再写审计。" : "External signals, projection writes, and script execution stay off by default; projection and ops actions preview, confirm, then audit."}</p>
            </section>
          </div>
        </aside>
      </main>
    </div>
  );
}
