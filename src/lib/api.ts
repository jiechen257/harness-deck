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

// Audit

export async function listAuditEvents(limit?: number): Promise<AuditEvent[]> {
  return call("list_audit_events", { limit: limit ?? null }, () => []);
}

// Signals

export async function listSignals(): Promise<SignalCard[]> {
  return call("list_signals", {}, () => []);
}

export async function refreshSignals(sourceId?: string): Promise<string[]> {
  return call("refresh_signals", { sourceId: sourceId ?? null }, () => []);
}

export async function listSignalSources(): Promise<SourceConfig[]> {
  return call("list_signal_sources", {}, () => []);
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
