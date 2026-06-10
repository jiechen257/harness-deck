export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";

// App

export interface HealthFactor {
  name: string;
  score: number;
  maxScore: number;
  met: boolean;
}

export interface AppStatus {
  appName: string;
  version: string;
  localeDefault: string;
  themeDefault: string;
  fixtureMode: boolean;
  realWritesEnabled: boolean;
  phase: string;
  healthScore: number;
  healthFactors: HealthFactor[];
}

// Usage

export interface DataSourceInfo {
  name: string;
  path: string;
  available: boolean;
}

export interface DailyActivityEntry {
  date: string;
  sessions: number;
  messages: number;
  toolCalls: number;
}

export interface ModelUsageItem {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

export interface CodexThreadItem {
  id: string;
  title: string | null;
  createdAt: string;
  model: string | null;
  tokensUsed: number | null;
  cwd: string | null;
}

export interface RealUsageSummary {
  totalSessions: number;
  totalMessages: number;
  totalCostUsd: number;
  totalTokens: number;
  windowHours: number;
  burnRatePerHour: number;
  driftEvents: number;
  dailyActivity: DailyActivityEntry[];
  modelUsage: ModelUsageItem[];
  codexThreadCount: number;
  codexRecentThreads: CodexThreadItem[];
  dataSources: DataSourceInfo[];
  longestSessionMinutes: number | null;
}

// Insights

export type RealInsightCategory = "TokenAnomaly" | "SessionActivity" | "ModelConcentration";

export interface RealInsight {
  id: string;
  category: RealInsightCategory;
  title: string;
  summary: string;
  severity: string;
  evidence: string;
  source: string;
}

// Signal Cards

export interface SignalCard {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourceTier: string;
  signalType: string;
  impact: string;
  confidence: string;
  excerpt: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Authorization

export type AuthScope =
  | "registry"
  | "local_read"
  | "external_signals"
  | "write_projection"
  | "script_execution";

export interface AuthorizationEntry {
  scope: AuthScope;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

// Registry

export interface RegistryConnection {
  id: string;
  path: string;
  registryType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Audit

export interface AuditEvent {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  outcome: string;
  createdAt: string;
}

// Signal Sources

export interface SourceConfig {
  id: string;
  name: string;
  sourceType: string;
  sourceTier: string;
  url: string | null;
  enabled: boolean;
  autoRefresh: boolean;
  updatedAt: string;
}

// System Skills

export interface SystemSkillMeta {
  id: string;
  version: string;
  description: string;
  outputType: string;
  enabled: boolean;
  template: string;
}

export interface SkillExecutionResult {
  skillId: string;
  agentKind: string;
  outputJson: string | null;
  durationMs: number;
  success: boolean;
  error: string | null;
}

// Projection

export type ActionType = "create" | "update" | "skip" | "conflict";
export type ProjectionModeType = "symlink" | "copy";

export interface ProjectionAction {
  assetId: string;
  assetName: string;
  registryPath: string;
  targetPath: string;
  mode: ProjectionModeType;
  action: ActionType;
  conflictReason: string | null;
}

export interface ProjectionPlan {
  targetKind: string;
  actions: ProjectionAction[];
  creates: number;
  updates: number;
  skips: number;
  conflicts: number;
}

export interface HealthFinding {
  findingType: string;
  severity: string;
  assetId: string | null;
  targetPath: string;
  detail: string;
}

export interface AdoptResult {
  assetId: string;
  registryPath: string;
  backupPath: string;
  symlinkPath: string;
}
