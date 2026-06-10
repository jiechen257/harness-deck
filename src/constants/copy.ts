import type { Locale } from "../lib/types";

export const copy = {
  "zh-CN": {
    workbenchTitle: "Hone 工作台",
    localReady: "本地优先就绪",
    productHealthLabel: "产品功能状态",
    healthScoreLabel: "健康度",
  },
  "en-US": {
    workbenchTitle: "Hone Workbench",
    localReady: "Local-first ready",
    productHealthLabel: "Product function status",
    healthScoreLabel: "Health score",
  },
} satisfies Record<Locale, Record<string, string>>;

export type CopyStrings = (typeof copy)["zh-CN"];
