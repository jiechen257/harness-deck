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

// BYOA agents

export type AgentKind = "Claude" | "Codex";

export interface AgentAvailability {
  kind: AgentKind;
  binaryPath: string | null;
  version: string | null;
  available: boolean;
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

// Practice loop

export interface PracticeCard {
  id: string;
  title: string;
  practiceType: string;
  summary: string | null;
  scenarios: string | null;
  comparable: string | null;
  applicability: string | null;
  generatedBy: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeDraft {
  title: string;
  practiceType: string;
  summary: string;
  scenarios: string[];
  comparable: string[];
  canGenerateAsset: boolean;
  suggestedAssetTypes: string[];
}

export interface NormalizeResult {
  signalId: string;
  success: boolean;
  draft: PracticeDraft | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
}

export interface LocalAsset {
  id: string;
  practiceId: string | null;
  assetType: string;
  registryPath: string;
  checksum: string | null;
  isSystem: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoopMetric {
  labelZh: string;
  labelEn: string;
  value: string;
}

export interface LoopSection {
  id: string;
  nameZh: string;
  nameEn: string;
  count: number;
  captionZh: string;
  captionEn: string;
  metrics: LoopMetric[];
  actionZh: string;
  actionEn: string;
  view: string;
  tone: string;
}

export interface LoopDecision {
  titleZh: string;
  titleEn: string;
  detailZh: string;
  detailEn: string;
  count: number;
  severity: string;
  view: string;
}

export interface TargetHealthSummary {
  name: string;
  detail: string;
  score: number;
  status: string;
}

export interface LoopSummary {
  healthScore: number;
  sections: LoopSection[];
  decisions: LoopDecision[];
  targets: TargetHealthSummary[];
  recentAudits: AuditEvent[];
  updatedAt: string;
  fixtureMode: boolean;
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

export interface RegistryCandidate {
  path: string;
  registryType: string;
  exists: boolean;
  writable: boolean;
  readOnly: boolean;
  active: boolean;
  reason: string;
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

export interface ProjectionExecutionResult {
  targetKind: string;
  executedProjectionIds: string[];
  skipped: number;
  conflicts: number;
}

export interface ProjectionTarget {
  targetKind: string;
  label: string;
  targetPath: string;
  exists: boolean;
  recommended: boolean;
}

export interface DiffPayload {
  sourcePath: string;
  targetPath: string;
  sourceExists: boolean;
  targetExists: boolean;
  sourceText: string | null;
  targetText: string | null;
  diffHunks: string[];
  readError: string | null;
}

export interface DriftTimelineItem {
  id: string;
  assetId: string;
  targetKind: string;
  targetPath: string;
  status: string;
  firstDetectedAt: string | null;
  lastCheckedAt: string | null;
  relatedEvent: string | null;
}

export interface AdapterCapability {
  targetKind: string;
  label: string;
  detect: boolean;
  readConfig: boolean;
  previewProjection: boolean;
  writeProjection: boolean;
  rollback: boolean;
  healthCheck: boolean;
  supported: boolean;
  note: string;
}

export interface Projection {
  id: string;
  assetId: string;
  targetKind: string;
  targetPath: string;
  mode: string;
  status: string;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
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
