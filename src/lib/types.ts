export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "Codex" | "ClaudeCode";
export type OperationType = "CreateFile" | "UpdateFile" | "AppendBlock" | "ReplaceBlock" | "Noop";
export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";
export type DataConfidence = "Official" | "LocalLog" | "Estimated" | "Missing";

export interface ProfileSummary {
  id: string;
  name: string;
  description: string;
  rules: number;
  skills: number;
  mcpReferences: number;
  targets: TargetKind[];
}

export interface TargetSummary {
  kind: TargetKind;
  name: string;
  fixture: boolean;
  status: string;
}

export interface DeployOperation {
  id: string;
  operationType: OperationType;
  path: string;
  reason: string;
  beforeSummary: string;
  afterSummary: string;
  risk: RiskLevel;
}

export interface DeployPlan {
  id: string;
  profileId: string;
  targetKind: TargetKind;
  dryRun: boolean;
  risk: RiskLevel;
  operations: DeployOperation[];
}

export interface ManifestSummary {
  id: string;
  createdAt: string;
  profileId: string;
  targetKind: TargetKind;
  dryRun: boolean;
  operationCount: number;
}

export interface TargetDiscoverySummary {
  kind: TargetKind;
  name: string;
  discovered: boolean;
  candidatePaths: string[];
  schemaStatus: string;
  rawConfigPreview: string | null;
}

export interface DiffEntry {
  path: string;
  baseSummary: string;
  targetSummary: string;
  plannedSummary: string;
  risk: RiskLevel;
}

export interface ConflictItem {
  id: string;
  path: string;
  summary: string;
  resolution: string;
  risk: RiskLevel;
}

export interface DriftReport {
  detected: boolean;
  count: number;
  summary: string;
}

export interface RollbackPreview {
  backupRequired: boolean;
  manifestRequired: boolean;
  rollbackAvailableAfterRealWrite: boolean;
  summary: string;
}

export interface SyncGovernance {
  profileId: string;
  targetKind: TargetKind;
  threeWayDiff: DiffEntry[];
  conflicts: ConflictItem[];
  drift: DriftReport;
  rollbackPreview: RollbackPreview;
}

export interface KeychainReference {
  reference: string;
  service: string;
  account: string;
  secretValueStored: boolean;
  secretPreview: string | null;
}

export interface AccountSwitchPreview {
  provider: string;
  fromModel: string;
  toModel: string;
  budgetDeltaUsd: number;
  keychainReference: string;
  requiresSecretValue: boolean;
  writesRealConfig: boolean;
}

export interface AuditEntry {
  id: string;
  createdAt: string;
  summary: string;
  severity: string;
}

export interface AccountWorkspace {
  provider: string;
  baseUrl: string;
  defaultModel: string;
  monthlyBudgetUsd: number;
  requestLimitPerDay: number;
  tokenLimitPerDay: number;
  keychainRef: KeychainReference;
  switchPlanPreview: AccountSwitchPreview;
  auditTrail: AuditEntry[];
}

export interface UsageMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  confidence: DataConfidence;
  confidenceLabel: string;
}

export interface UsageSummary {
  windowHours: number;
  totalTokens: number;
  costUsd: number;
  durationMinutes: number;
  driftEvents: number;
  burnRateUsdPerHour: number;
  metrics: UsageMetric[];
}
