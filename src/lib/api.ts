import { invoke } from "@tauri-apps/api/core";

import type {
  AdoptResult,
  AdapterCapability,
  AppStatus,
  AuditEvent,
  AuthorizationEntry,
  AuthScope,
  DiffPayload,
  DriftTimelineItem,
  HealthFinding,
  LocalAsset,
  LoopDecision,
  LoopSummary,
  NormalizeResult,
  OpsScript,
  OpsScriptExecutionResult,
  OpsScriptPreview,
  PracticeCard,
  PracticeDraft,
  Projection,
  ProjectionExecutionResult,
  ProjectionPlan,
  ProjectionTarget,
  RealInsight,
  RealUsageSummary,
  RegistryConnection,
  RegistryCandidate,
  SignalCard,
  SkillExecutionResult,
  SourceConfig,
  SystemSkillMeta,
} from "./types";

type TauriWindow = Window & { __TAURI_INTERNALS__?: unknown };

function isTauriEnv(): boolean {
  return typeof window !== "undefined" && !!(window as TauriWindow).__TAURI_INTERNALS__;
}

async function call<T>(cmd: string, args: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!isTauriEnv()) return fallback();
  return invoke<T>(cmd, args);
}

function nowIso(): string {
  return new Date().toISOString();
}

const fallbackSignals: SignalCard[] = [
  {
    id: "codex-changelog",
    title: "Codex Desktop 1.19.0 changes agent profile loading",
    sourceUrl: "https://example.com/codex-changelog",
    sourceTier: "official",
    signalType: "changelog",
    impact: "high",
    confidence: "confirmed",
    excerpt: "Profile loading and runtime assembly changed.",
    publishedAt: nowIso(),
    fetchedAt: nowIso(),
    status: "inbox",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "claude-code-release",
    title: "Claude Code updates skill discovery behavior",
    sourceUrl: "https://example.com/claude-code",
    sourceTier: "official",
    signalType: "changelog",
    impact: "medium",
    confidence: "confirmed",
    excerpt: "Skill discovery now prefers local project scopes.",
    publishedAt: nowIso(),
    fetchedAt: nowIso(),
    status: "inbox",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "community-handoff",
    title: "Community pattern: session handoff with registry-backed skills",
    sourceUrl: "https://example.com/community",
    sourceTier: "community",
    signalType: "community_discussion",
    impact: "medium",
    confidence: "unverified",
    excerpt: "Teams are versioning reusable local agent skills in Git.",
    publishedAt: nowIso(),
    fetchedAt: nowIso(),
    status: "inbox",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const fallbackSources: SourceConfig[] = [
  { id: "codex-changelog", name: "Codex Desktop changelog", sourceType: "changelog", sourceTier: "official", url: "https://example.com/codex", enabled: true, autoRefresh: false, updatedAt: nowIso() },
  { id: "claude-code-changelog", name: "Claude Code changelog", sourceType: "changelog", sourceTier: "official", url: "https://example.com/claude", enabled: true, autoRefresh: false, updatedAt: nowIso() },
  { id: "maintainer-registry-patterns", name: "Maintainer registry patterns", sourceType: "community", sourceTier: "maintainer", url: "https://example.com/maintainer", enabled: false, autoRefresh: false, updatedAt: nowIso() },
  { id: "community-patterns", name: "Community practice signals", sourceType: "community_discussion", sourceTier: "community", url: "https://example.com/community", enabled: false, autoRefresh: false, updatedAt: nowIso() },
];

const fallbackPractices: PracticeCard[] = [
  {
    id: "practice-local-harness-review",
    title: "Local harness review",
    practiceType: "Workflow",
    summary: "检查 registry、Claude/Codex target、projection drift 和孤立资产。",
    scenarios: JSON.stringify(["本地 agent 配置发生变化后执行规则、skills、hooks 检查"]),
    comparable: JSON.stringify(["Manual file inspection", "ad hoc shell scripts"]),
    applicability: "can_generate_asset",
    generatedBy: "fixture",
    status: "adoptable",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "practice-signal-normalization",
    title: "Signal normalization",
    practiceType: "Methodology",
    summary: "把 changelog、模型讯息和社区热度规范化为 Practice Card。",
    scenarios: JSON.stringify(["从外部更新中抽取可执行的本地实践"]),
    comparable: JSON.stringify(["Saved links", "release note notes"]),
    applicability: "can_generate_asset",
    generatedBy: "fixture",
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const fallbackAssets: LocalAsset[] = [
  {
    id: "asset-local-harness-review",
    practiceId: "practice-local-harness-review",
    assetType: "skill",
    registryPath: "system-skills/local-harness-review",
    checksum: null,
    isSystem: true,
    status: "ready",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const fallbackProjections: Projection[] = [];

let fallbackAuditIndex = 3;
const fallbackAudits: AuditEvent[] = [
  { id: "audit-1", eventType: "projection.preview", entityType: "projection", entityId: "local-harness-review", detail: "2 symlinks repaired", outcome: "success", createdAt: nowIso() },
  { id: "audit-2", eventType: "practice.created", entityType: "practice", entityId: "practice-local-harness-review", detail: "browser fixture", outcome: "success", createdAt: nowIso() },
  { id: "audit-3", eventType: "review.detected", entityType: "asset", entityId: "asset-local-harness-review", detail: "fixture drift detected", outcome: "warning", createdAt: nowIso() },
];

const fallbackAuthorizations: AuthorizationEntry[] = [
  { scope: "registry", granted: false, grantedAt: null, revokedAt: null },
  { scope: "local_read", granted: false, grantedAt: null, revokedAt: null },
  { scope: "external_signals", granted: false, grantedAt: null, revokedAt: null },
  { scope: "write_projection", granted: false, grantedAt: null, revokedAt: null },
  { scope: "script_execution", granted: false, grantedAt: null, revokedAt: null },
];

const fallbackOpsScripts: OpsScript[] = [
  {
    id: "ops-codex-proxy",
    name: "Codex proxy",
    path: "~/start-codex.sh",
    description: "launchctl environment and Codex restart control",
    riskLevel: "high",
    status: "registered",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "ops-sleep-guard",
    name: "Sleep guard",
    path: "~/dsleep",
    description: "caffeinate guard with stop boundary",
    riskLevel: "medium",
    status: "registered",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "ops-wake-display",
    name: "Wake display",
    path: "~/dwake",
    description: "pmset displaysleepnow quick action",
    riskLevel: "medium",
    status: "registered",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

function recordFallbackAudit(event: Omit<AuditEvent, "id" | "createdAt">): void {
  fallbackAuditIndex += 1;
  fallbackAudits.unshift({ ...event, id: `audit-${fallbackAuditIndex}`, createdAt: nowIso() });
}

function fallbackAuthorization(scope: AuthScope): AuthorizationEntry | undefined {
  return fallbackAuthorizations.find((entry) => entry.scope === scope);
}

function requireFallbackAuthorization(scope: AuthScope): void {
  if (!fallbackAuthorization(scope)?.granted) {
    throw new Error(`${scope} authorization required`);
  }
}

function copySignal(signal: SignalCard): SignalCard {
  return { ...signal };
}

function copyPractice(practice: PracticeCard): PracticeCard {
  return { ...practice };
}

function copyAsset(asset: LocalAsset): LocalAsset {
  return { ...asset };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "practice-asset";
}

function metric(labelZh: string, labelEn: string, value: number | string) {
  return { labelZh, labelEn, value: String(value) };
}

function decision(
  titleZh: string,
  titleEn: string,
  detailZh: string,
  detailEn: string,
  count: number,
  severity: string,
  view: string,
): LoopDecision {
  return { titleZh, titleEn, detailZh, detailEn, count, severity, view };
}

function buildFallbackSummary(): LoopSummary {
  const inboxSignals = fallbackSignals.filter((signal) => signal.status === "inbox").length;
  const normalizedSignals = fallbackSignals.filter((signal) => signal.status === "normalized").length;
  const highImpact = fallbackSignals.filter((signal) => signal.impact === "high").length;
  const officialSignals = fallbackSignals.filter((signal) => signal.sourceTier === "official").length;
  const practiceIdsWithAssets = new Set(fallbackAssets.map((asset) => asset.practiceId).filter(Boolean));
  const assetPending = fallbackPractices.filter((practice) => !practiceIdsWithAssets.has(practice.id)).length;
  const adoptable = fallbackPractices.filter((practice) => practice.status === "draft" || practice.status === "adoptable").length;
  const readyAssets = fallbackAssets.filter((asset) => asset.status === "ready").length;
  const activeProjections = fallbackProjections.filter((projection) => projection.status === "active");
  const activeClaude = activeProjections.filter((projection) => projection.targetKind === "claude_code").length;
  const activeCodex = activeProjections.filter((projection) => projection.targetKind === "codex").length;
  const projectedAssetIds = new Set(activeProjections.map((projection) => projection.assetId));
  const missingProjection = fallbackAssets.filter((asset) => !projectedAssetIds.has(asset.id)).length;
  const decisions = [
    ...(inboxSignals > 0 ? [decision("规范化信号", "Normalize signals", "生成 Practice Card 预览", "Generate Practice Card previews", inboxSignals, "info", "library")] : []),
    ...(assetPending > 0 ? [decision("准备本地资产", "Prepare local assets", "把实践关联到可投射资产", "Link practices to projectable assets", assetPending, "info", "library")] : []),
    ...(missingProjection > 0 ? [decision("预览投射", "Preview projection", "为本地资产生成 Claude/Codex 投射计划", "Build Claude/Codex projection plans for local assets", missingProjection, "warn", "apply")] : []),
  ];

  return {
    healthScore: Math.max(35, Math.min(96, 82 + readyAssets * 2 - assetPending - missingProjection)),
    fixtureMode: true,
    updatedAt: nowIso(),
    sections: [
      {
        id: "signals",
        nameZh: "信号",
        nameEn: "Signals",
        count: inboxSignals,
        captionZh: "待整理",
        captionEn: "in inbox",
        metrics: [metric("高影响", "High impact", highImpact), metric("官方来源", "Official", officialSignals), metric("已规范化", "Normalized", normalizedSignals)],
        actionZh: `规范化 ${Math.min(inboxSignals, 6)} 条信号`,
        actionEn: `Normalize ${Math.min(inboxSignals, 6)} signals`,
        view: "library",
        tone: "blue",
      },
      {
        id: "practices",
        nameZh: "实践",
        nameEn: "Practices",
        count: fallbackPractices.length,
        captionZh: "已沉淀",
        captionEn: "captured",
        metrics: [metric("可采纳", "Adoptable", adoptable), metric("待生成资产", "Assets pending", assetPending), metric("已应用", "Applied", 0)],
        actionZh: `准备 ${Math.min(assetPending, 3)} 个资产`,
        actionEn: `Prepare ${Math.min(assetPending, 3)} assets`,
        view: "library",
        tone: "teal",
      },
      {
        id: "assets",
        nameZh: "本地资产",
        nameEn: "Local Assets",
        count: fallbackAssets.length,
        captionZh: "已登记",
        captionEn: "registered",
        metrics: [metric("注册表就绪", "Registry ready", readyAssets), metric("Claude 已投射", "Claude projected", activeClaude), metric("Codex 已投射", "Codex projected", activeCodex)],
        actionZh: `处理 ${missingProjection} 个投射项`,
        actionEn: `Handle ${missingProjection} projections`,
        view: "apply",
        tone: "blue",
      },
      {
        id: "review",
        nameZh: "评审",
        nameEn: "Review",
        count: missingProjection,
        captionZh: "待处理",
        captionEn: "open",
        metrics: [metric("偏移/断链", "Drift/broken", 0), metric("缺失投射", "Missing", missingProjection), metric("孤立资产", "Orphan", 0)],
        actionZh: `评审 ${missingProjection} 个问题`,
        actionEn: `Review ${missingProjection} issues`,
        view: "review",
        tone: "purple",
      },
      {
        id: "operations",
        nameZh: "运维",
        nameEn: "Operations",
        count: 0,
        captionZh: "待接入",
        captionEn: "pending wiring",
        metrics: [metric("Codex 代理", "Codex proxy", 0), metric("防睡守护", "Sleep guard", 0), metric("今日脚本", "Scripts today", 0)],
        actionZh: "查看运行状态",
        actionEn: "Open run log",
        view: "operations",
        tone: "gold",
      },
    ],
    decisions,
    targets: [
      { name: "Claude Code", detail: `${activeClaude} browser fixture projections`, score: activeClaude > 0 ? 90 : 82, status: "fixture" },
      { name: "Codex", detail: `${activeCodex} browser fixture projections`, score: activeCodex > 0 ? 90 : 78, status: "fixture" },
    ],
    recentAudits: fallbackAudits.slice(0, 5).map((audit) => ({ ...audit })),
  };
}

// App

export async function getAppStatus(): Promise<AppStatus> {
  return call("get_app_status", {}, () => ({
    appName: "Hone",
    version: "0.2.0",
    localeDefault: "zh-CN",
    themeDefault: "light",
    fixtureMode: true,
    realWritesEnabled: false,
    phase: "practice-operations",
    healthScore: 82,
    healthFactors: [],
  }));
}

export async function openWorkbench(): Promise<void> {
  return call("open_workbench", {}, () => undefined);
}

// Usage

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

// Insights

export async function listRealInsights(): Promise<RealInsight[]> {
  return call("list_real_insights", {}, () => []);
}

// Authorization

export async function getAuthorizationState(): Promise<AuthorizationEntry[]> {
  return call("get_authorization_state", {}, () => fallbackAuthorizations.map((entry) => ({ ...entry })));
}

export async function grantAuthorization(scope: AuthScope): Promise<void> {
  return call("grant_authorization", { scope }, () => {
    const entry = fallbackAuthorization(scope);
    if (entry) {
      entry.granted = true;
      entry.grantedAt = nowIso();
      entry.revokedAt = null;
    }
  });
}

export async function revokeAuthorization(scope: AuthScope): Promise<void> {
  return call("revoke_authorization", { scope }, () => {
    const entry = fallbackAuthorization(scope);
    if (entry) {
      entry.granted = false;
      entry.revokedAt = nowIso();
    }
  });
}

// Registry

export async function getActiveRegistry(): Promise<RegistryConnection | null> {
  return call("get_active_registry", {}, () => ({
    id: "fallback-registry",
    path: "~/HoneRegistry",
    registryType: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
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

export async function detectRegistryCandidates(): Promise<RegistryCandidate[]> {
  return call("detect_registry_candidates", {}, () => [
    { path: "~/HoneRegistry", registryType: "initialized", exists: false, writable: false, readOnly: false, active: false, reason: "default Hone registry location" },
    { path: "/Users/zhici/work-pro/my-agent-skill", registryType: "user", exists: true, writable: true, readOnly: false, active: false, reason: "known local registry candidate" },
    { path: "starter://bundled", registryType: "starter", exists: true, writable: false, readOnly: true, active: false, reason: "bundled starter registry read-only fallback" },
  ]);
}

export async function initializeRegistry(path: string): Promise<RegistryConnection> {
  return call("initialize_registry", { path }, () => ({
    id: `fallback-registry-${Date.now()}`,
    path,
    registryType: "initialized",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

export async function useStarterRegistryReadonly(): Promise<RegistryConnection> {
  return call("use_starter_registry_readonly", {}, () => ({
    id: `fallback-starter-${Date.now()}`,
    path: "starter://bundled",
    registryType: "starter",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

// Audit

export async function listAuditEvents(limit?: number): Promise<AuditEvent[]> {
  return call("list_audit_events", { limit: limit ?? null }, () => fallbackAudits.slice(0, limit ?? 20).map((audit) => ({ ...audit })));
}

// Operations

export async function listOpsScripts(): Promise<OpsScript[]> {
  return call("list_ops_scripts", {}, () => fallbackOpsScripts.map((script) => ({ ...script })));
}

export async function previewOpsScript(scriptId: string): Promise<OpsScriptPreview> {
  return call("preview_ops_script", { scriptId }, () => {
    const script = fallbackOpsScripts.find((item) => item.id === scriptId);
    if (!script) throw new Error(`ops script not found: ${scriptId}`);
    return {
      scriptId: script.id,
      name: script.name,
      path: script.path,
      riskLevel: script.riskLevel,
      steps: [
        "Resolve script path and show the intended command boundary",
        "Check script_execution authorization before confirmation",
        "Record an audit event for the confirmed operation",
        "Keep shell execution disabled in the current safe MVP",
      ],
      requiresAuthorization: "script_execution",
      willExecute: false,
    };
  });
}

export async function confirmOpsScript(scriptId: string): Promise<OpsScriptExecutionResult> {
  return call("confirm_ops_script", { scriptId }, () => {
    requireFallbackAuthorization("script_execution");
    const script = fallbackOpsScripts.find((item) => item.id === scriptId);
    if (!script) throw new Error(`ops script not found: ${scriptId}`);
    recordFallbackAudit({
      eventType: "ops_script_confirmed",
      entityType: "ops_script",
      entityId: script.id,
      detail: `${script.name} safe MVP confirmation`,
      outcome: "success",
    });
    return {
      scriptId: script.id,
      status: "confirmed_safe_mvp",
      auditEventType: "ops_script_confirmed",
      message: "Authorization accepted and audit recorded; shell execution is disabled in the current safe MVP.",
    };
  });
}

// Signals

export async function listSignals(): Promise<SignalCard[]> {
  return call("list_signals", {}, () => fallbackSignals.map(copySignal));
}

export async function refreshSignals(sourceId?: string): Promise<string[]> {
  return call("refresh_signals", { sourceId: sourceId ?? null }, () => {
    const source = fallbackSources.find((item) => item.id === sourceId) ?? fallbackSources.find((item) => item.enabled);
    if (!source || !source.enabled) return [];
    const id = `fixture-signal-${Date.now()}`;
    fallbackSignals.unshift({
      id,
      title: `${source.name} fixture signal`,
      sourceUrl: source.url,
      sourceTier: source.sourceTier,
      signalType: source.sourceType,
      impact: source.sourceTier === "official" ? "high" : "medium",
      confidence: source.sourceTier === "official" ? "confirmed" : "unverified",
      excerpt: "Browser fixture refresh created a local signal for the MVP loop.",
      publishedAt: nowIso(),
      fetchedAt: nowIso(),
      status: "inbox",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    recordFallbackAudit({
      eventType: "signal_refresh",
      entityType: "source",
      entityId: source.id,
      detail: "browser fixture refresh",
      outcome: "success",
    });
    return [id];
  });
}

export async function listSignalSources(): Promise<SourceConfig[]> {
  return call("list_signal_sources", {}, () => fallbackSources.map((source) => ({ ...source })));
}

export async function toggleSignalSource(sourceId: string, enabled: boolean): Promise<void> {
  return call("toggle_signal_source", { sourceId, enabled }, () => {
    const source = fallbackSources.find((item) => item.id === sourceId);
    if (source) {
      source.enabled = enabled;
      source.updatedAt = nowIso();
    }
  });
}

export async function toggleAutoRefresh(sourceId: string, autoRefresh: boolean): Promise<void> {
  return call("toggle_auto_refresh", { sourceId, autoRefresh }, () => {
    const source = fallbackSources.find((item) => item.id === sourceId);
    if (source) {
      source.autoRefresh = autoRefresh;
      source.updatedAt = nowIso();
    }
  });
}

// Practice loop

export async function listPractices(): Promise<PracticeCard[]> {
  return call("list_practices", {}, () => fallbackPractices.map(copyPractice));
}

export async function listLocalAssets(): Promise<LocalAsset[]> {
  return call("list_local_assets", {}, () => fallbackAssets.map(copyAsset));
}

export async function getLoopSummary(): Promise<LoopSummary> {
  return call("get_loop_summary", {}, buildFallbackSummary);
}

export async function normalizeSignal(signalId: string, agentKind?: string): Promise<NormalizeResult> {
  return call("normalize_signal", { signalId, agentKind: agentKind ?? null }, () => {
    const signal = fallbackSignals.find((item) => item.id === signalId);
    if (!signal) {
      return {
        signalId,
        success: false,
        draft: null,
        errorCode: "NotFound",
        errorMessage: "Signal not found in browser fixture",
        durationMs: 0,
      };
    }
    const draft: PracticeDraft = {
      title: signal.title.replace(/ changes? | updates? /i, " practice "),
      practiceType: signal.signalType.includes("community") ? "Methodology" : "Workflow",
      summary: signal.excerpt ?? `Normalize ${signal.title} into a reusable harness practice.`,
      scenarios: [
        "本地 agent 配置更新后同步 rules、skills、hooks",
        "Claude Code 与 Codex 需要保持同一套 harness profile",
      ],
      comparable: ["Manual notes", "One-off project rules"],
      canGenerateAsset: true,
      suggestedAssetTypes: ["skill", "rule"],
    };
    recordFallbackAudit({
      eventType: "signal_normalized_preview",
      entityType: "signal",
      entityId: signalId,
      detail: draft.title,
      outcome: "success",
    });
    return { signalId, success: true, draft, errorCode: null, errorMessage: null, durationMs: 180 };
  });
}

export async function createPracticeFromSignal(signalId: string, draft: PracticeDraft): Promise<PracticeCard> {
  return call("create_practice_from_signal", { signalId, draft }, () => {
    const id = `practice-${slugify(draft.title)}-${Date.now()}`;
    const practice: PracticeCard = {
      id,
      title: draft.title,
      practiceType: draft.practiceType,
      summary: draft.summary,
      scenarios: JSON.stringify(draft.scenarios),
      comparable: JSON.stringify(draft.comparable),
      applicability: draft.canGenerateAsset ? "can_generate_asset" : "reference_only",
      generatedBy: "normalize-practice-card",
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    fallbackPractices.unshift(practice);
    const signal = fallbackSignals.find((item) => item.id === signalId);
    if (signal) {
      signal.status = "normalized";
      signal.updatedAt = nowIso();
    }
    recordFallbackAudit({
      eventType: "practice_created",
      entityType: "practice",
      entityId: id,
      detail: `signal ${signalId}`,
      outcome: "success",
    });
    return copyPractice(practice);
  });
}

export async function createLocalAssetFromPractice(
  practiceId: string,
  assetType: string,
  registryPath: string,
  isSystem = false,
): Promise<LocalAsset> {
  return call("create_local_asset_from_practice", { practiceId, assetType, registryPath, isSystem }, () => {
    const id = `asset-${slugify(registryPath)}-${Date.now()}`;
    const asset: LocalAsset = {
      id,
      practiceId,
      assetType,
      registryPath,
      checksum: null,
      isSystem,
      status: "ready",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    fallbackAssets.unshift(asset);
    const practice = fallbackPractices.find((item) => item.id === practiceId);
    if (practice) {
      practice.status = "adoptable";
      practice.updatedAt = nowIso();
    }
    recordFallbackAudit({
      eventType: "local_asset_created",
      entityType: "local_asset",
      entityId: id,
      detail: registryPath,
      outcome: "success",
    });
    return copyAsset(asset);
  });
}

// System Skills

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

export async function listProjectionTargets(): Promise<ProjectionTarget[]> {
  return call("list_projection_targets", {}, () => [
    { targetKind: "claude_code", label: "Claude Code", targetPath: "~/.claude/skills", exists: false, recommended: true },
    { targetKind: "codex", label: "Codex", targetPath: "~/.codex/skills", exists: false, recommended: true },
  ]);
}

export async function listAdapterCapabilities(): Promise<AdapterCapability[]> {
  return call("list_adapter_capabilities", {}, () => [
    { targetKind: "claude_code", label: "Claude Code", detect: true, readConfig: true, previewProjection: true, writeProjection: true, rollback: true, healthCheck: true, supported: true, note: "MVP target" },
    { targetKind: "codex", label: "Codex", detect: true, readConfig: true, previewProjection: true, writeProjection: true, rollback: true, healthCheck: true, supported: true, note: "MVP target" },
    { targetKind: "cursor", label: "Cursor", detect: false, readConfig: false, previewProjection: false, writeProjection: false, rollback: false, healthCheck: false, supported: false, note: "Future target only" },
    { targetKind: "windsurf", label: "Windsurf", detect: false, readConfig: false, previewProjection: false, writeProjection: false, rollback: false, healthCheck: false, supported: false, note: "Future target only" },
  ]);
}

export async function listProjections(targetKind?: string): Promise<Projection[]> {
  return call("list_projections", { targetKind: targetKind ?? null }, () => (
    fallbackProjections
      .filter((projection) => !targetKind || projection.targetKind === targetKind)
      .map((projection) => ({ ...projection }))
  ));
}

export async function listDriftTimeline(targetKind: string): Promise<DriftTimelineItem[]> {
  return call("list_drift_timeline", { targetKind }, () => (
    fallbackProjections
      .filter((projection) => projection.targetKind === targetKind)
      .map((projection) => ({
        id: projection.id,
        assetId: projection.assetId,
        targetKind: projection.targetKind,
        targetPath: projection.targetPath,
        status: projection.status,
        firstDetectedAt: projection.createdAt,
        lastCheckedAt: projection.lastChecked ?? projection.updatedAt,
        relatedEvent: projection.status === "removed" ? "projection_rollback" : "projection_executed",
      }))
  ));
}

export async function previewAssetDiff(
  registryPath: string,
  registryAssetPath: string,
  targetPath: string,
): Promise<DiffPayload> {
  return call("preview_asset_diff", { registryPath, registryAssetPath, targetPath }, () => ({
    sourcePath: `${registryPath}/${registryAssetPath}`,
    targetPath,
    sourceExists: true,
    targetExists: false,
    sourceText: "# Browser fixture source\n",
    targetText: null,
    diffHunks: ["target missing or unreadable"],
    readError: null,
  }));
}

export async function previewProjection(registryPath: string, targetPath: string, targetKind: string): Promise<ProjectionPlan> {
  return call("preview_projection", { registryPath, targetPath, targetKind }, () => ({
    targetKind,
    actions: [
      ...fallbackAssets.map((asset) => ({
        assetId: asset.id,
        assetName: asset.registryPath.split("/").at(-1) ?? asset.id,
        registryPath: asset.registryPath,
        targetPath: `${targetPath}/${asset.registryPath.split("/").at(-1) ?? asset.id}`,
        mode: "symlink" as const,
        action: fallbackProjections.some((projection) => projection.assetId === asset.id && projection.targetKind === targetKind && projection.status === "active") ? "skip" as const : "create" as const,
        conflictReason: null,
      })),
      { assetId: "unmanaged-grill-me", assetName: "grill-me", registryPath: `${registryPath}/system-skills/grill-me`, targetPath: `${targetPath}/grill-me`, mode: "symlink", action: "conflict", conflictReason: "browser fixture unmanaged target" },
    ],
    creates: fallbackAssets.filter((asset) => !fallbackProjections.some((projection) => projection.assetId === asset.id && projection.targetKind === targetKind && projection.status === "active")).length,
    updates: 0,
    skips: fallbackAssets.filter((asset) => fallbackProjections.some((projection) => projection.assetId === asset.id && projection.targetKind === targetKind && projection.status === "active")).length,
    conflicts: 1,
  }));
}

export async function confirmProjection(registryPath: string, targetPath: string, targetKind: string): Promise<ProjectionExecutionResult> {
  return call("confirm_projection", { registryPath, targetPath, targetKind }, () => {
    requireFallbackAuthorization("write_projection");
    const plan = {
      actions: fallbackAssets.filter((asset) => !fallbackProjections.some((projection) => projection.assetId === asset.id && projection.targetKind === targetKind && projection.status === "active")),
    };
    const executedProjectionIds = plan.actions.map((asset) => {
      const id = `projection-${asset.id}-${targetKind}-${Date.now()}`;
      fallbackProjections.unshift({
        id,
        assetId: asset.id,
        targetKind,
        targetPath: `${targetPath}/${asset.registryPath.split("/").at(-1) ?? asset.id}`,
        mode: "symlink",
        status: "active",
        lastChecked: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      return id;
    });
    recordFallbackAudit({
      eventType: "projection_executed",
      entityType: "projection",
      entityId: executedProjectionIds[0] ?? targetKind,
      detail: `browser fixture ${registryPath} -> ${targetPath}`,
      outcome: "success",
    });
    return { targetKind, executedProjectionIds, skipped: 0, conflicts: 1 };
  });
}

export async function adoptAsset(
  targetPath: string, registryPath: string, registryDest: string,
  assetType: string, backupPath: string, targetKind: string,
): Promise<AdoptResult> {
  return call("adopt_asset", { targetPath, registryPath, registryDest, assetType, backupPath, targetKind }, () => {
    requireFallbackAuthorization("write_projection");
    const assetId = `asset-${slugify(registryDest)}-${Date.now()}`;
    fallbackAssets.unshift({
      id: assetId,
      practiceId: null,
      assetType,
      registryPath: registryDest,
      checksum: null,
      isSystem: false,
      status: "ready",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const projectionId = `projection-${assetId}-${targetKind}-${Date.now()}`;
    fallbackProjections.unshift({
      id: projectionId,
      assetId,
      targetKind,
      targetPath,
      mode: "symlink",
      status: "active",
      lastChecked: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    recordFallbackAudit({
      eventType: "asset_adopted",
      entityType: "local_asset",
      entityId: assetId,
      detail: `${targetPath} -> ${registryDest}`,
      outcome: "success",
    });
    return { assetId, registryPath: registryDest, backupPath: `${backupPath}/adopt-${slugify(registryDest)}`, symlinkPath: targetPath };
  });
}

export async function rollbackProjection(projectionId: string): Promise<void> {
  return call("rollback_projection", { projectionId }, () => {
    requireFallbackAuthorization("write_projection");
    const projection = fallbackProjections.find((item) => item.id === projectionId);
    if (projection) {
      projection.status = "removed";
      projection.updatedAt = nowIso();
      projection.lastChecked = nowIso();
    }
    recordFallbackAudit({
      eventType: "projection_rollback",
      entityType: "projection",
      entityId: projectionId,
      detail: "browser fixture rollback removes target link only",
      outcome: "success",
    });
  });
}

export async function checkProjectionHealth(targetKind: string): Promise<HealthFinding[]> {
  return call("check_projection_health", { targetKind }, () => [
    { findingType: "broken_symlink", severity: "warn", assetId: "local-harness-review", targetPath: "~/.codex/skills/local-harness-review", detail: "Target symlink points to a missing registry path." },
    { findingType: "missing_projection", severity: "info", assetId: "normalize-practice-card", targetPath: "~/.claude/skills/normalize-practice-card", detail: "Asset is ready in registry but not projected to Claude Code." },
  ]);
}
