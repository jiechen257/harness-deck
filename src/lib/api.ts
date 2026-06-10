import { invoke } from "@tauri-apps/api/core";

import type {
  AdoptResult,
  AppStatus,
  AuditEvent,
  AuthorizationEntry,
  AuthScope,
  HealthFinding,
  ProjectionPlan,
  RealInsight,
  RealUsageSummary,
  RegistryConnection,
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

// Audit

export async function listAuditEvents(limit?: number): Promise<AuditEvent[]> {
  return call("list_audit_events", { limit: limit ?? null }, () => [
    { id: "audit-1", eventType: "projection.preview", entityType: "projection", entityId: "local-harness-review", detail: "2 symlinks repaired", outcome: "success", createdAt: new Date().toISOString() },
    { id: "audit-2", eventType: "operations.preview", entityType: "script", entityId: "start-codex.sh", detail: "launchctl diff generated", outcome: "success", createdAt: new Date().toISOString() },
    { id: "audit-3", eventType: "review.detected", entityType: "asset", entityId: "grill-me", detail: "unmanaged Codex skill detected", outcome: "warning", createdAt: new Date().toISOString() },
  ]);
}

// Signals

export async function listSignals(): Promise<SignalCard[]> {
  return call("list_signals", {}, () => [
    {
      id: "codex-changelog",
      title: "Codex Desktop 1.19.0 changes agent profile loading",
      sourceUrl: "https://example.com/codex-changelog",
      sourceTier: "official",
      signalType: "changelog",
      impact: "high",
      confidence: "confirmed",
      excerpt: "Profile loading and runtime assembly changed.",
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      status: "inbox",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      status: "inbox",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "community-handoff",
      title: "Community pattern: session handoff with registry-backed skills",
      sourceUrl: "https://example.com/community",
      sourceTier: "community",
      signalType: "community",
      impact: "medium",
      confidence: "unverified",
      excerpt: "Teams are versioning reusable local agent skills in Git.",
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      status: "inbox",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
}

export async function refreshSignals(sourceId?: string): Promise<string[]> {
  return call("refresh_signals", { sourceId: sourceId ?? null }, () => []);
}

export async function listSignalSources(): Promise<SourceConfig[]> {
  return call("list_signal_sources", {}, () => [
    { id: "codex-changelog", name: "Codex Desktop changelog", sourceType: "changelog", sourceTier: "official", url: "https://example.com/codex", enabled: true, autoRefresh: false, updatedAt: new Date().toISOString() },
    { id: "claude-code-changelog", name: "Claude Code changelog", sourceType: "changelog", sourceTier: "official", url: "https://example.com/claude", enabled: true, autoRefresh: false, updatedAt: new Date().toISOString() },
    { id: "community-patterns", name: "Community practice signals", sourceType: "community", sourceTier: "community", url: "https://example.com/community", enabled: false, autoRefresh: false, updatedAt: new Date().toISOString() },
  ]);
}

export async function toggleSignalSource(sourceId: string, enabled: boolean): Promise<void> {
  return call("toggle_signal_source", { sourceId, enabled }, () => undefined);
}

export async function toggleAutoRefresh(sourceId: string, autoRefresh: boolean): Promise<void> {
  return call("toggle_auto_refresh", { sourceId, autoRefresh }, () => undefined);
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

export async function previewProjection(registryPath: string, targetPath: string, targetKind: string): Promise<ProjectionPlan> {
  return call("preview_projection", { registryPath, targetPath, targetKind }, () => ({
    targetKind,
    actions: [
      { assetId: "local-harness-review", assetName: "local-harness-review", registryPath: `${registryPath}/system-skills/local-harness-review`, targetPath: `${targetPath}/local-harness-review`, mode: "symlink", action: "create", conflictReason: null },
      { assetId: "normalize-practice-card", assetName: "normalize-practice-card", registryPath: `${registryPath}/system-skills/normalize-practice-card`, targetPath: `${targetPath}/normalize-practice-card`, mode: "symlink", action: "update", conflictReason: null },
      { assetId: "context7-mcp", assetName: "context7 MCP fragment", registryPath: `${registryPath}/mcp/context7.toml`, targetPath: "~/.claude/settings/context7.toml", mode: "copy", action: "skip", conflictReason: "copy fallback" },
    ],
    creates: 1,
    updates: 0,
    skips: 1,
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
  return call("check_projection_health", { targetKind }, () => [
    { findingType: "broken_symlink", severity: "warn", assetId: "local-harness-review", targetPath: "~/.codex/skills/local-harness-review", detail: "Target symlink points to a missing registry path." },
    { findingType: "missing_projection", severity: "info", assetId: "normalize-practice-card", targetPath: "~/.claude/skills/normalize-practice-card", detail: "Asset is ready in registry but not projected to Claude Code." },
  ]);
}
