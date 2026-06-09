import type { ComponentType } from "react";

export type ViewId =
  | "home"
  | "discover"
  | "profiles"
  | "sync"
  | "operate"
  | "usage"
  | "insights"
  | "guard"
  | "settings";

export interface NavItem {
  id: ViewId;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  matches?: ViewId[];
  zh: string;
  en: string;
}
