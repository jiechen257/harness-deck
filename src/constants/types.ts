import type { ComponentType } from "react";

export type ViewId = "home" | "discover" | "usage" | "insights" | "settings" | "apply";
export type NavViewId = Exclude<ViewId, "apply">;

export interface NavItem {
  id: NavViewId;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  zh: string;
  en: string;
}
