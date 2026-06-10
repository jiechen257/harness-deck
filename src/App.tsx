import { getCurrentWindow } from "@tauri-apps/api/window";
import { Bell, Search } from "lucide-react";
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
import { isNavSelected, navItems, navLabel, viewLabel } from "./constants/navigation";
import type { ViewId } from "./constants/types";
import { useLocale } from "./hooks/useLocale";
import { useTheme } from "./hooks/useTheme";
import {
  getAppStatus,
  openWorkbench as openWorkbenchWindow,
} from "./lib/api";
import type { AppStatus } from "./lib/types";

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
  const [refreshing, setRefreshing] = useState(false);
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
    void getAppStatus().then(setAppStatus);
  }, []);

  const healthScore = appStatus?.healthScore ?? 0;
  const pageSubtitle = {
    home: locale === "zh-CN" ? "闭环状态总览" : "Loop status overview",
    library: locale === "zh-CN" ? "信号 -> 实践 -> 资产 -> 归档" : "Signals -> Practices -> Assets -> Archived",
    apply: locale === "zh-CN" ? "注册表仓库到 Claude Code / Codex 的安全投射" : "Safe projection from registry to Claude Code / Codex",
    review: locale === "zh-CN" ? "本地 harness 资产结构诊断" : "Local harness asset diagnostics",
    operations: locale === "zh-CN" ? "本机代理使用脚本的受控运行" : "Controlled local agent scripts",
    settings: locale === "zh-CN" ? "registry、读取、网络、写入和脚本授权" : "Registry, read, network, write, and script permissions",
  }[activeView];

  const openWorkbench = () => {
    setActiveView("home");
    void openWorkbenchWindow();
  };

  const refreshData = useCallback(() => {
    setRefreshing(true);
    void getAppStatus()
      .then(setAppStatus)
      .finally(() => setRefreshing(false));
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

  const isMenuPanelWindow = new URLSearchParams(window.location.search).get("panel") === "1";

  if (isMenuPanelWindow) {
    return (
      <div className="panel-shell" data-theme={theme}>
        <MenuBarPanel
          healthScore={healthScore}
          locale={locale}
          onRefresh={refreshData}
          onOpenWorkbench={openWorkbench}
          refreshing={refreshing}
          standalone
        />
      </div>
    );
  }

  return (
    <div className="app-shell native-status-app" data-theme={theme} data-testid="app-shell">
      <section className="native-window workbench-window" aria-label={t.workbenchTitle}>
        <header
          className="native-titlebar workbench-topbar"
          onMouseDown={(e) => {
            if (e.buttons === 1 && !(e.target as HTMLElement).closest("button, a, input, select, [role='menu']")) {
              e.preventDefault();
              getCurrentWindow().startDragging();
            }
          }}
        >
          <nav className="segmented-nav" aria-label="Workbench views">
            <div className="titlebar-brand-wrapper">
              <button
                type="button"
                className="titlebar-brand"
                aria-expanded={brandMenuOpen}
                onClick={(e) => { e.stopPropagation(); setBrandMenuOpen(!brandMenuOpen); }}
              >
                <HarnessLogo size={32} />
              </button>
              {brandMenuOpen ? (
                <div className="brand-dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("settings"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "设置" : "Settings"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActiveView("review"); setBrandMenuOpen(false); }}>
                    {locale === "zh-CN" ? "本地评审" : "Local Review"}
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
                    {locale === "zh-CN" ? "关于 Hone" : "About Hone"}
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
          <div className="topbar-tools" aria-label={locale === "zh-CN" ? "工作台工具" : "Workbench tools"}>
            <label className="topbar-search">
              <Search size={14} aria-hidden="true" />
              <input aria-label={locale === "zh-CN" ? "搜索" : "Search"} placeholder={locale === "zh-CN" ? "搜索 ⌘K" : "Search ⌘K"} />
            </label>
            <button className="topbar-tool-button" type="button">{locale === "zh-CN" ? "标志实验室" : "Logo Lab"}</button>
            <button className="topbar-tool-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? (locale === "zh-CN" ? "深色" : "Dark") : (locale === "zh-CN" ? "浅色" : "Light")}
            </button>
            <button className="topbar-icon-button" type="button" aria-label={locale === "zh-CN" ? "通知" : "Notifications"}><Bell size={16} aria-hidden="true" /></button>
            <span className="topbar-avatar" aria-label="Developer">D</span>
          </div>
        </header>

        <main className="native-content" ref={contentRef}>
          <section className="workbench-page-head">
            <div>
              <h2>{viewLabel(locale, activeView)}</h2>
              <p>{pageSubtitle}</p>
            </div>
            <div className="page-head-actions">
              <button className="action-button" type="button" onClick={() => setActiveView("settings")}>
                {locale === "zh-CN" ? "首次设置" : "First Run"}
              </button>
              <button className="action-button primary" type="button" onClick={refreshData} disabled={refreshing}>
                {refreshing ? (locale === "zh-CN" ? "刷新中..." : "Refreshing...") : (locale === "zh-CN" ? "刷新信号" : "Refresh Signals")}
              </button>
            </div>
          </section>
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
    </div>
  );
}
