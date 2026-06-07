import { invoke } from "@tauri-apps/api/core";

import type {
  AccountWorkspace,
  DeployPlan,
  FeedItem,
  FindBestSkillResult,
  Insight,
  ManifestSummary,
  ProfileSummary,
  RegistrySkillTemplate,
  SyncGovernance,
  TargetDiscoverySummary,
  TargetKind,
  TargetSummary,
  UsageSummary,
  WakeControlSummary,
  WakeMode,
  WakeSession,
} from "./types";

type TauriWindow = Window & { __TAURI_INTERNALS__?: unknown };

const fallbackProfiles: ProfileSummary[] = [
  {
    id: "macos-dev",
    name: "macOS Dev 配置集",
    description: "面向 Tauri、Rust 和 macOS app 验证的本地优先配置集。",
    rules: 2,
    skills: 2,
    mcpReferences: 1,
    targets: ["Codex", "ClaudeCode"],
  },
  {
    id: "bug-hunt",
    name: "Bug Hunt 配置集",
    description: "带 fixture 测试和根因分析节奏的排障配置集。",
    rules: 1,
    skills: 1,
    mcpReferences: 0,
    targets: ["Codex", "ClaudeCode"],
  },
];

const fallbackTargets: TargetSummary[] = [
  { kind: "Codex", name: "Codex fixture", fixture: true, status: "dry-run only" },
  { kind: "ClaudeCode", name: "Claude Code fixture", fixture: true, status: "dry-run only" },
];

const fallbackRegistryTemplates: RegistrySkillTemplate[] = [
  {
    id: "tauri-desktop-guardrails",
    name: "Tauri Desktop Guardrails",
    description: "Local-first macOS app safety, backup, manifest, and config write checks.",
    taskTags: ["tauri", "desktop", "sync", "codex", "claude", "safety"],
    qualityScore: 0.94,
    communitySignal: 0.72,
    personalFeedback: 0.88,
    safetyRisk: "Low",
    source: "curated-local",
  },
  {
    id: "prompt-ops-privacy",
    name: "Prompt Ops Privacy Review",
    description: "Checks prompt, log, token, and secret-handling boundaries before sync.",
    taskTags: ["privacy", "guard", "secrets"],
    qualityScore: 0.9,
    communitySignal: 0.64,
    personalFeedback: 0.81,
    safetyRisk: "Low",
    source: "curated-local",
  },
  {
    id: "experimental-hook-runner",
    name: "Experimental Hook Runner",
    description: "Prototype hook automation that remains gated until explicit install consent.",
    taskTags: ["hooks", "automation"],
    qualityScore: 0.68,
    communitySignal: 0.51,
    personalFeedback: 0.43,
    safetyRisk: "Medium",
    source: "curated-local",
  },
];

const fallbackInsights: Insight[] = [
  {
    id: "insight-token-anomaly",
    title: "Token anomaly",
    summary: "Estimated token burn is 24% above this profile's five-hour baseline.",
    severity: "medium",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-repeated-failures",
    title: "Repeated failures",
    summary: "Two dry-run operations repeatedly require manual conflict review.",
    severity: "medium",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-profile-drift",
    title: "Profile drift",
    summary: "Target state differs from the last manifest in rules and skills.",
    severity: "high",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-update-impact",
    title: "Update impact",
    summary: "Registry update can improve sync guard wording without touching secrets.",
    severity: "low",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
];

const fallbackFeedItems: FeedItem[] = [
  {
    id: "feed-profile-impact",
    title: "Harness Profile impact alert",
    summary: "A curated guardrail update affects the active macOS Dev profile.",
    priority: "High",
    source: "registry-cache",
    profileImpact: true,
  },
  {
    id: "feed-community-template",
    title: "Community template update",
    summary: "A privacy review template was refreshed in the local cache.",
    priority: "Normal",
    source: "community-cache",
    profileImpact: false,
  },
];

const fallbackWakeActions: WakeSession[] = [
  wakeSession("StandardAwake", true, null, false, true),
  wakeSession("TimedAwake", true, 45, false, true),
  wakeSession("DisplaySleep", false, null, false, true),
  wakeSession("ExperimentalLidAwake", false, 30, true, false),
];

function isTauriRuntime() {
  return typeof window !== "undefined" && Boolean((window as TauriWindow).__TAURI_INTERNALS__);
}

async function call<T>(command: string, args: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!isTauriRuntime()) {
    return fallback();
  }

  return invoke<T>(command, args);
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  return call("list_profiles", {}, () => fallbackProfiles);
}

export async function openWorkbench(): Promise<boolean> {
  return call("open_workbench", {}, () => true);
}

export async function listTargets(): Promise<TargetSummary[]> {
  return call("list_targets", {}, () => fallbackTargets);
}

export async function generateDeployPlan(profileId: string, targetKind: TargetKind): Promise<DeployPlan> {
  return call("generate_deploy_plan", { profileId, targetKind }, () => {
    const targetPath = targetKind === "Codex" ? "~/.codex/AGENTS.md" : "~/.claude/CLAUDE.md";
    return {
      id: `plan-${profileId}-${targetKind.toLowerCase()}-fixture`,
      profileId,
      targetKind,
      dryRun: true,
      risk: "Medium",
      operations: [
        {
          id: "validate-profile",
          operationType: "Noop",
          path: "fixture://profile",
          reason: "validate profile rules, skills, MCP references, and sync policy",
          beforeSummary: "profile fixture loaded",
          afterSummary: "schema valid, secret scan clean",
          risk: "Low",
        },
        {
          id: "append-rules",
          operationType: "AppendBlock",
          path: targetPath,
          reason: "append scoped rules block from Harness Profile rules",
          beforeSummary: "fixture target rules snapshot",
          afterSummary: "2 rules staged for dry-run",
          risk: "Medium",
        },
        {
          id: "copy-skills",
          operationType: "CreateFile",
          path: "fixture://skills",
          reason: "copy skill references into deploy manifest only",
          beforeSummary: "no real skill files touched",
          afterSummary: "2 skill references recorded",
          risk: "Low",
        },
      ],
    };
  });
}

export async function confirmDryRunDeploy(plan: DeployPlan): Promise<ManifestSummary> {
  return call("confirm_dry_run_deploy", { plan }, () => ({
    id: `manifest-${plan.profileId}-${plan.targetKind.toLowerCase()}-fixture`,
    createdAt: "fixture-now",
    profileId: plan.profileId,
    targetKind: plan.targetKind,
    dryRun: true,
    operationCount: plan.operations.length,
  }));
}

export async function discoverTargets(authorizedForLocalRead: boolean): Promise<TargetDiscoverySummary[]> {
  return call("discover_targets", { authorizedForLocalRead }, () => {
    if (!authorizedForLocalRead) {
      throw new Error("local target discovery requires explicit read authorization");
    }

    return [
      {
        kind: "Codex",
        name: "Codex local target",
        discovered: false,
        candidatePaths: ["~/.codex/AGENTS.md", "~/.codex/config.toml"],
        schemaStatus: "target directory not found",
        rawConfigPreview: null,
      },
      {
        kind: "ClaudeCode",
        name: "Claude Code local target",
        discovered: false,
        candidatePaths: ["~/.claude/CLAUDE.md", "~/.claude/settings.json"],
        schemaStatus: "target directory not found",
        rawConfigPreview: null,
      },
    ];
  });
}

export async function getSyncGovernance(profileId: string, targetKind: TargetKind): Promise<SyncGovernance> {
  return call("get_sync_governance", { profileId, targetKind }, () => {
    const targetPath = targetKind === "Codex" ? "~/.codex/AGENTS.md" : "~/.claude/CLAUDE.md";

    return {
      profileId,
      targetKind,
      threeWayDiff: [
        {
          path: targetPath,
          baseSummary: "last manifest had 2 managed rules",
          targetSummary: "fixture target has 1 unmanaged local rule",
          plannedSummary: "append scoped managed block and keep local override",
          risk: "Medium",
        },
        {
          path: "fixture://skills",
          baseSummary: "1 skill reference",
          targetSummary: "2 skill references",
          plannedSummary: "record skill copy plan in manifest",
          risk: "Low",
        },
      ],
      conflicts: [
        {
          id: "conflict-local-rule-overlap",
          path: targetPath,
          summary: "local target rule overlaps with profile rule scope",
          resolution: "review before real write; dry-run keeps both entries",
          risk: "Medium",
        },
      ],
      drift: {
        detected: true,
        count: 2,
        summary: "target differs from last known manifest in rules and skills",
      },
      rollbackPreview: {
        backupRequired: true,
        manifestRequired: true,
        rollbackAvailableAfterRealWrite: true,
        summary: "real write would create backup snapshot and rollback metadata before applying changes",
      },
    };
  });
}

export async function getAccountWorkspace(): Promise<AccountWorkspace> {
  return call("get_account_workspace", {}, () => ({
    provider: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5-codex",
    monthlyBudgetUsd: 150,
    requestLimitPerDay: 240,
    tokenLimitPerDay: 2_000_000,
    keychainRef: {
      reference: "keychain://HarnessDeck/accounts/openai",
      service: "HarnessDeck.MockKeychain",
      account: "openai",
      secretValueStored: false,
      secretPreview: null,
    },
    switchPlanPreview: {
      provider: "OpenAI",
      fromModel: "gpt-5-codex",
      toModel: "gpt-5-codex-high-context",
      budgetDeltaUsd: 12,
      keychainReference: "keychain://HarnessDeck/accounts/openai",
      requiresSecretValue: false,
      writesRealConfig: false,
    },
    auditTrail: [
      {
        id: "audit-keychain-ref-linked",
        createdAt: "fixture-now",
        summary: "mock Keychain reference linked without storing a secret value",
        severity: "info",
      },
      {
        id: "audit-switch-preview",
        createdAt: "fixture-now",
        summary: "switch-plan preview is local-only and does not rewrite provider config",
        severity: "info",
      },
    ],
  }));
}

export async function getUsageSummary(): Promise<UsageSummary> {
  return call("get_usage_summary", {}, () => ({
    windowHours: 5,
    totalTokens: 182_400,
    costUsd: 4.82,
    durationMinutes: 146,
    driftEvents: 2,
    burnRateUsdPerHour: 0.96,
    metrics: [
      { id: "tokens", label: "tokens", value: "182.4k", unit: "", confidence: "LocalLog", confidenceLabel: "LocalLog" },
      { id: "cost", label: "cost", value: "$4.82", unit: "USD", confidence: "Estimated", confidenceLabel: "Estimated" },
      { id: "duration", label: "duration", value: "146", unit: "min", confidence: "LocalLog", confidenceLabel: "LocalLog" },
      { id: "drift", label: "drift", value: "2", unit: "events", confidence: "Estimated", confidenceLabel: "Estimated" },
      {
        id: "official-bill",
        label: "official billing",
        value: "not connected",
        unit: "",
        confidence: "Missing",
        confidenceLabel: "Missing",
      },
      {
        id: "burn-rate",
        label: "burn rate",
        value: "$0.96",
        unit: "USD/h",
        confidence: "Estimated",
        confidenceLabel: "Estimated",
      },
    ],
  }));
}

export async function listRegistryTemplates(): Promise<RegistrySkillTemplate[]> {
  return call("list_registry_templates", {}, () => fallbackRegistryTemplates);
}

export async function findBestSkill(task: string, allowGithubDiscovery: boolean): Promise<FindBestSkillResult> {
  return call("find_best_skill", { task, allowGithubDiscovery }, () => ({
    task,
    recommendedSkill: fallbackRegistryTemplates[0],
    score: 0.86,
    scoring: {
      taskMatch: 0.92,
      quality: 0.94,
      community: 0.72,
      personal: 0.88,
      safetyPenalty: 0.02,
    },
    githubDiscoveryEnabled: allowGithubDiscovery,
    remoteCallPerformed: false,
    safetySummary: "safety risk: Low",
  }));
}

export async function listInsights(): Promise<Insight[]> {
  return call("list_insights", {}, () => fallbackInsights);
}

export async function listFeedItems(): Promise<FeedItem[]> {
  return call("list_feed_items", {}, () => fallbackFeedItems);
}

export async function listHighPriorityFeed(): Promise<FeedItem[]> {
  return call("list_high_priority_feed", {}, () => fallbackFeedItems.filter((item) => item.priority === "High"));
}

export async function getWakeControl(): Promise<WakeControlSummary> {
  return call("get_wake_control", {}, () => ({
    currentState: fallbackWakeActions[0],
    quickActions: fallbackWakeActions,
  }));
}

export async function requestWakeMode(mode: WakeMode, confirmed: boolean): Promise<WakeSession> {
  return call("request_wake_mode_command", { mode, confirmed }, () => {
    if (mode === "ExperimentalLidAwake" && !confirmed) {
      throw new Error("experimental lid-awake requires explicit confirmation");
    }

    return wakeSession(
      mode,
      mode !== "DisplaySleep",
      mode === "TimedAwake" || mode === "ExperimentalLidAwake" ? 45 : null,
      mode === "ExperimentalLidAwake",
      confirmed || mode !== "ExperimentalLidAwake",
    );
  });
}

function wakeSession(
  mode: WakeMode,
  active: boolean,
  durationMinutes: number | null,
  experimental: boolean,
  confirmed: boolean,
): WakeSession {
  return {
    mode,
    active,
    durationMinutes,
    displaySleepAllowed: mode === "DisplaySleep",
    experimental,
    requiresConfirmation: mode === "ExperimentalLidAwake",
    confirmed,
    implementation: "mock/system-safe",
  };
}
