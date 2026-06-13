import { BarChart3, Compass, Home, Settings, Sparkles } from "lucide-react";

import type { Locale } from "../lib/types";
import type { NavItem, ViewId } from "./types";

export const navItems: NavItem[] = [
  { id: "home", icon: Home, zh: "首页", en: "Home" },
  { id: "discover", icon: Compass, zh: "发现", en: "Discover" },
  { id: "usage", icon: BarChart3, zh: "用量", en: "Usage" },
  { id: "insights", icon: Sparkles, zh: "洞察", en: "Insights" },
  { id: "settings", icon: Settings, zh: "设置", en: "Settings" },
];

export const viewLabels: Record<ViewId, { zh: string; en: string }> = {
  home: { zh: "首页", en: "Home" },
  discover: { zh: "发现", en: "Discover" },
  usage: { zh: "用量", en: "Usage" },
  insights: { zh: "洞察", en: "Insights" },
  settings: { zh: "设置", en: "Settings" },
  apply: { zh: "投射计划", en: "Projection Plan" },
};

export function navLabel(locale: Locale, item: NavItem) {
  return locale === "zh-CN" ? item.zh : item.en;
}

export function viewLabel(locale: Locale, viewId: ViewId) {
  const item = viewLabels[viewId];
  return locale === "zh-CN" ? item.zh : item.en;
}

export function isNavSelected(item: NavItem, activeView: ViewId) {
  return item.id === activeView;
}
