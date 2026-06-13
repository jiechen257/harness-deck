import { Boxes, GitBranch, Home, Library, Settings, ShieldCheck } from "lucide-react";

import type { Locale } from "../lib/types";
import type { NavItem, ViewId } from "./types";

export const navItems: NavItem[] = [
  { id: "home", icon: Home, zh: "首页", en: "Home" },
  { id: "library", icon: Library, zh: "实践库", en: "Practice Library" },
  { id: "apply", icon: GitBranch, zh: "应用与同步", en: "Apply & Sync" },
  { id: "review", icon: ShieldCheck, zh: "本地评审", en: "Local Review" },
  { id: "operations", icon: Boxes, zh: "运维", en: "Operations" },
  { id: "settings", icon: Settings, zh: "设置", en: "Settings" },
];

export const viewLabels: Record<ViewId, { zh: string; en: string }> = {
  home: { zh: "首页", en: "Home" },
  library: { zh: "实践库", en: "Practice Library" },
  apply: { zh: "应用与同步", en: "Apply & Sync" },
  review: { zh: "本地评审", en: "Local Review" },
  operations: { zh: "运维", en: "Operations" },
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
  return item.id === activeView;
}
