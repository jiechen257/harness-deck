import type { ComponentType } from "react";

export type ViewId = "home" | "discover" | "usage" | "insights" | "settings";

export interface NavItem {
  id: ViewId;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  zh: string;
  en: string;
}
