import { invoke } from "@tauri-apps/api/core";

import type {
  AccountWorkspace,
  AgentAvailability,
  AgentInvocation,
  AgentKind,
  AgentResult,
  AppConfig,
  AppStatus,
  AuditEvent,
  AuthorizationEntry,
  AuthScope,
  CrawlItem,
  CrawlSummary,
  DeployPlan,
  FeedItem,
  FindBestSkillResult,
  Insight,
  InstallHistoryEntry,
  InstallRequest,
  InstallResult,
  LocalSkillEntry,
  ManifestSummary,
  OptimizationSuggestion,
  ProfileSummary,
  RealInsight,
  RealUsageSummary,
  RegistryConnection,
  RegistrySkillTemplate,
  AdoptResult,
  HealthFinding,
  ProjectionPlan,
  SkillExecutionResult,
  SystemSkillMeta,
  SuggestionStatus,
  SyncGovernance,
  TargetDiscoverySummary,
  TargetInfo,
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
    name: "Tauri 桌面端守护规则",
    description: "本地优先的 macOS 应用安全、备份、清单和配置写入检查。",
    taskTags: ["tauri", "desktop", "sync", "codex", "claude", "safety"],
    qualityScore: 0.94,
    communitySignal: 0.72,
    personalFeedback: 0.88,
    safetyRisk: "Low",
    source: "curated-local",
  },
  {
    id: "prompt-ops-privacy",
    name: "Prompt 隐私审查",
    description: "在同步前检查 prompt、日志、token 和密钥处理边界。",
    taskTags: ["privacy", "guard", "secrets"],
    qualityScore: 0.9,
    communitySignal: 0.64,
    personalFeedback: 0.81,
    safetyRisk: "Low",
    source: "curated-local",
  },
  {
    id: "experimental-hook-runner",
    name: "实验性 Hook 运行器",
    description: "原型 hook 自动化，在用户显式同意安装前保持管控状态。",
    taskTags: ["hooks", "automation"],
    qualityScore: 0.68,
    communitySignal: 0.51,
    personalFeedback: 0.43,
    safetyRisk: "Medium",
    source: "curated-local",
  },
];

const fallbackLocalSkills: LocalSkillEntry[] = [
  {
    name: "tauri-desktop-guardrails",
    title: "Tauri Desktop Guardrails",
    description: "Local-first macOS app safety, backup, manifest, and config write checks.",
    source: "claude",
    path: "~/.claude/skills/tauri-desktop-guardrails",
  },
  {
    name: "prompt-ops-privacy",
    title: "Prompt Ops Privacy Review",
    description: "Checks prompt, log, token, and secret-handling boundaries before sync.",
    source: "claude",
    path: "~/.claude/skills/prompt-ops-privacy",
  },
  {
    name: "experimental-hook-runner",
    title: "Experimental Hook Runner",
    description: "Prototype hook automation that remains gated until explicit install consent.",
    source: "codex",
    path: "~/.codex/skills/experimental-hook-runner",
  },
];

const fallbackInsights: Insight[] = [
  {
    id: "insight-token-anomaly",
    title: "Token 用量异常",
    summary: "预估 token 消耗比该配置集五小时基线高 24%。",
    severity: "medium",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-repeated-failures",
    title: "重复失败",
    summary: "两次 dry-run 操作反复需要手动冲突审查。",
    severity: "medium",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-profile-drift",
    title: "配置集漂移",
    summary: "目标状态与最近一次 manifest 在规则和技能上存在差异。",
    severity: "high",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
  {
    id: "insight-update-impact",
    title: "更新影响",
    summary: "注册表更新可改进同步守护措辞，不涉及密钥。",
    severity: "low",
    relatedProfileId: "macos-dev",
    source: "local-rule",
  },
];

const fallbackFeedItems: FeedItem[] = [
  {
    id: "feed-profile-impact",
    title: "Harness 配置集影响警报",
    summary: "一项策划的守护规则更新影响了当前活跃的 macOS Dev 配置集。",
    priority: "High",
    source: "registry-cache",
    profileImpact: true,
  },
  {
    id: "feed-community-template",
    title: "社区模板更新",
    summary: "一个隐私审查模板在本地缓存中已刷新。",
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

export async function getAppStatus(): Promise<AppStatus> {
  return call("get_app_status", {}, () => ({
    appName: "HarnessDeck",
    version: "0.1.0",
    localeDefault: "zh-CN",
    themeDefault: "light",
    fixtureMode: true,
    realWritesEnabled: false,
    phase: "implementation-design-phase-0",
    healthScore: 0,
    healthFactors: [],
  }));
}

export async function openWorkbench(): Promise<boolean> {
  return call("open_workbench", {}, () => true);
}

export async function getAppConfig(): Promise<AppConfig> {
  return call("get_app_config", {}, () => ({ registryLocalPath: null }));
}

export async function setAppConfig(config: AppConfig): Promise<void> {
  return call("set_app_config", { config }, () => undefined);
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
        configSummary: null,
      },
      {
        kind: "ClaudeCode",
        name: "Claude Code local target",
        discovered: false,
        candidatePaths: ["~/.claude/CLAUDE.md", "~/.claude/settings.json"],
        schemaStatus: "target directory not found",
        rawConfigPreview: null,
        configSummary: null,
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

export async function getRealUsageSummary(): Promise<RealUsageSummary> {
  return call("get_real_usage_summary", {}, () => ({
    totalSessions: 0,
    totalMessages: 0,
    totalCostUsd: 0,
    totalTokens: 0,
    windowHours: 0,
    burnRatePerHour: 0,
    driftEvents: 0,
    dailyActivity: [],
    modelUsage: [],
    codexThreadCount: 0,
    codexRecentThreads: [],
    dataSources: [
      { name: "Claude Code stats", path: "~/.claude/stats-cache.json", available: false },
      { name: "Codex threads", path: "~/.codex/state_5.sqlite", available: false },
    ],
    longestSessionMinutes: null,
  }));
}

const fallbackRealInsights: RealInsight[] = [
  {
    id: "fixture-token-anomaly",
    category: "TokenAnomaly",
    title: "High token burn detected",
    summary: "2 day(s) with message count >2 std dev above mean (45). Peak: 132 messages.",
    severity: "medium",
    evidence: "Anomaly dates: 2026-01-15, 2026-01-18. Mean: 45, StdDev: 28, Threshold: 101",
    source: "stats-cache.json",
  },
  {
    id: "fixture-session-activity",
    category: "SessionActivity",
    title: "Session frequency increasing",
    summary: "Average 8.3 sessions/day over the past week, up from 4.1 sessions/day previously.",
    severity: "low",
    evidence: "Recent 7-day average: 8.3, prior 30-day average: 4.1",
    source: "stats-cache.json",
  },
  {
    id: "fixture-model-concentration",
    category: "ModelConcentration",
    title: "Single model dominance",
    summary: "95% of tokens consumed by claude-sonnet-4-5-20250514. Consider diversifying for cost optimization.",
    severity: "medium",
    evidence: "claude-sonnet-4-5-20250514: 95.2%, claude-haiku-4-5-20251001: 4.8%",
    source: "stats-cache.json",
  },
];

export async function listRealInsights(): Promise<RealInsight[]> {
  return call("list_real_insights", {}, () => fallbackRealInsights);
}

export async function detectAgents(): Promise<AgentAvailability[]> {
  return call("detect_agents", {}, () => []);
}

export async function invokeAgent(invocation: AgentInvocation): Promise<AgentResult> {
  return call("invoke_agent", { invocation }, () => ({
    kind: invocation.kind,
    exitCode: -1,
    stdout: "",
    stderr: "BYOA not available in browser mode",
    parsedJson: null,
    durationMs: 0,
    timedOut: false,
  }));
}

export async function listRegistryTemplates(): Promise<RegistrySkillTemplate[]> {
  return call("list_registry_templates", {}, () => fallbackRegistryTemplates);
}

export async function listLocalSkills(): Promise<LocalSkillEntry[]> {
  return call("list_local_skills", {}, () => fallbackLocalSkills);
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

// Crawl Pipeline

export async function crawlAllSources(customKeywords?: string[]): Promise<CrawlSummary> {
  return call("crawl_all_sources", { customKeywords: customKeywords ?? null }, () => ({
    results: [],
    totalRaw: 0,
    totalFiltered: 0,
    totalRanked: 0,
    agentUsed: null,
  }));
}

export async function rankCrawlResults(items: CrawlItem[], agentKind: AgentKind): Promise<CrawlItem[]> {
  return call("rank_crawl_results", { items, agentKind }, () => items);
}

export async function installSkill(request: InstallRequest, suggestionId?: string): Promise<InstallResult> {
  return call("install_skill_command", { request, suggestionId: suggestionId ?? null }, () => ({
    success: false,
    target: request.target,
    installedPath: "",
    message: "Install not available in browser mode",
  }));
}

// Suggestion persistence

export async function saveSuggestion(suggestion: OptimizationSuggestion): Promise<void> {
  return call("save_suggestion_command", { suggestion }, () => undefined);
}

export async function updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<OptimizationSuggestion> {
  return call("update_suggestion_status_command", { id, status }, () => ({
    id,
    insightId: "",
    description: "",
    proposedChange: { target: "ClaudeCode" as const, action: "CopySkill" as const, skillName: "", content: "", targetPath: "" },
    confidence: 0,
    status,
    createdAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  }));
}

export async function listSuggestions(): Promise<OptimizationSuggestion[]> {
  return call("list_suggestions_command", {}, () => []);
}

// Install history

export async function listInstallHistory(): Promise<InstallHistoryEntry[]> {
  return call("list_install_history_command", {}, () => []);
}

export async function revertInstall(entryId: string): Promise<InstallHistoryEntry> {
  return call("revert_install_command", { entryId }, () => ({
    id: entryId,
    suggestionId: null,
    skillName: "",
    target: "ClaudeCode" as const,
    installedPath: "",
    backupPath: null,
    installedAt: "",
    reverted: true,
    revertedAt: new Date().toISOString(),
  }));
}

export async function listAvailableTargets(): Promise<TargetInfo[]> {
  return call("list_available_targets", {}, () => [
    { kind: "ClaudeCode", displayName: "Claude Code", available: false, skillsCount: 0, configPath: null },
    { kind: "Codex", displayName: "Codex", available: false, skillsCount: 0, configPath: null },
  ]);
}

// Hone data model

export async function getAuthorizationState(): Promise<AuthorizationEntry[]> {
  return call("get_authorization_state", {}, () => [
    { scope: "registry" as AuthScope, granted: false, grantedAt: null, revokedAt: null },
    { scope: "local_read" as AuthScope, granted: false, grantedAt: null, revokedAt: null },
    { scope: "external_signals" as AuthScope, granted: false, grantedAt: null, revokedAt: null },
    { scope: "write_projection" as AuthScope, granted: false, grantedAt: null, revokedAt: null },
    { scope: "script_execution" as AuthScope, granted: false, grantedAt: null, revokedAt: null },
  ]);
}

export async function grantAuthorization(scope: AuthScope): Promise<void> {
  return call("grant_authorization", { scope }, () => undefined);
}

export async function revokeAuthorization(scope: AuthScope): Promise<void> {
  return call("revoke_authorization", { scope }, () => undefined);
}

export async function getActiveRegistry(): Promise<RegistryConnection | null> {
  return call("get_active_registry", {}, () => null);
}

export async function setRegistryConnection(path: string, registryType: string): Promise<RegistryConnection> {
  return call("set_registry_connection", { path, registryType }, () => ({
    id: "fallback",
    path,
    registryType,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function listAuditEvents(limit?: number): Promise<AuditEvent[]> {
  return call("list_audit_events", { limit: limit ?? null }, () => []);
}

// System Practice Skills

export async function listSystemSkills(registryPath: string): Promise<SystemSkillMeta[]> {
  return call("list_system_skills", { registryPath }, () => []);
}

export async function executeSystemSkill(
  registryPath: string,
  skillId: string,
  variables: Record<string, string>,
  agentKind: string,
): Promise<SkillExecutionResult> {
  return call("execute_system_skill", { registryPath, skillId, variables, agentKind }, () => ({
    skillId,
    agentKind,
    outputJson: null,
    durationMs: 0,
    success: false,
    error: "Not available in browser mode",
  }));
}

export async function toggleSystemSkill(skillId: string, enabled: boolean): Promise<void> {
  return call("toggle_system_skill", { skillId, enabled }, () => undefined);
}

// Projection

export async function previewProjection(registryPath: string, targetPath: string, targetKind: string): Promise<ProjectionPlan> {
  return call("preview_projection", { registryPath, targetPath, targetKind }, () => ({
    targetKind,
    actions: [],
    creates: 0,
    updates: 0,
    skips: 0,
    conflicts: 0,
  }));
}

export async function confirmProjection(registryPath: string, targetPath: string, targetKind: string): Promise<string[]> {
  return call("confirm_projection", { registryPath, targetPath, targetKind }, () => []);
}

export async function adoptAsset(
  targetPath: string, registryPath: string, registryDest: string,
  assetType: string, backupPath: string, targetKind: string,
): Promise<AdoptResult> {
  return call("adopt_asset", { targetPath, registryPath, registryDest, assetType, backupPath, targetKind }, () => ({
    assetId: "", registryPath: registryDest, backupPath: "", symlinkPath: targetPath,
  }));
}

export async function rollbackProjection(projectionId: string): Promise<void> {
  return call("rollback_projection", { projectionId }, () => undefined);
}

export async function checkProjectionHealth(targetKind: string): Promise<HealthFinding[]> {
  return call("check_projection_health", { targetKind }, () => []);
}
