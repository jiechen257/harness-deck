import { Home, Layers, Shuffle, Sparkles, TerminalSquare } from "lucide-react";

import type { Locale } from "../lib/types";
import type { NavItem, ViewId } from "./types";

export const navItems: NavItem[] = [
  { id: "home", icon: Home, zh: "首页", en: "Home" },
  { id: "profiles", icon: Layers, matches: ["discover", "settings"], zh: "配置", en: "Configure" },
  { id: "sync", icon: Shuffle, matches: ["guard"], zh: "同步", en: "Sync" },
  { id: "operate", icon: TerminalSquare, zh: "运行", en: "Operate" },
  { id: "insights", icon: Sparkles, matches: ["usage"], zh: "洞察", en: "Insights" },
];

export const viewLabels: Record<ViewId, { zh: string; en: string }> = {
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

export function navLabel(locale: Locale, item: NavItem) {
  return locale === "zh-CN" ? item.zh : item.en;
}

export function viewLabel(locale: Locale, viewId: ViewId) {
  const item = viewLabels[viewId];
  return locale === "zh-CN" ? item.zh : item.en;
}

export function isNavSelected(item: NavItem, activeView: ViewId) {
  return item.id === activeView || Boolean(item.matches?.includes(activeView));
}

export function secondaryViewsFor(activeView: ViewId): ViewId[] {
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
