export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "Codex" | "ClaudeCode";
export type OperationType = "CreateFile" | "UpdateFile" | "AppendBlock" | "ReplaceBlock" | "Noop";
export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";
export type DataConfidence = "Official" | "LocalLog" | "Estimated" | "Missing";
export type WakeMode = "StandardAwake" | "TimedAwake" | "DisplaySleep" | "ExperimentalLidAwake";

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

export interface TargetConfigSummary {
  model?: string;
  editorMode?: string;
  theme?: string;
  mcpServerCount: number;
  skillCount: number;
  hookCount: number;
  permissionAllowCount: number;
  permissionDenyCount: number;
  pluginCount: number;
  startupCount: number;
  projectCount: number;
  version?: string;
}

export interface TargetDiscoverySummary {
  kind: TargetKind;
  name: string;
  discovered: boolean;
  candidatePaths: string[];
  schemaStatus: string;
  rawConfigPreview: string | null;
  configSummary: TargetConfigSummary | null;
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

export interface LocalSkillEntry {
  name: string;
  title?: string;
  description?: string;
  source: string;
  path: string;
}

export interface RegistrySkillTemplate {
  id: string;
  name: string;
  description: string;
  taskTags: string[];
  qualityScore: number;
  communitySignal: number;
  personalFeedback: number;
  safetyRisk: string;
  source: string;
}

export interface SkillScoreBreakdown {
  taskMatch: number;
  quality: number;
  community: number;
  personal: number;
  safetyPenalty: number;
}

export interface FindBestSkillResult {
  task: string;
  recommendedSkill: RegistrySkillTemplate;
  score: number;
  scoring: SkillScoreBreakdown;
  githubDiscoveryEnabled: boolean;
  remoteCallPerformed: boolean;
  safetySummary: string;
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  severity: string;
  relatedProfileId: string;
  source: string;
}

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  priority: string;
  source: string;
  profileImpact: boolean;
}

export interface WakeSession {
  mode: WakeMode;
  active: boolean;
  durationMinutes: number | null;
  displaySleepAllowed: boolean;
  experimental: boolean;
  requiresConfirmation: boolean;
  confirmed: boolean;
  implementation: string;
}

export interface WakeControlSummary {
  currentState: WakeSession;
  quickActions: WakeSession[];
}

// ---- Real data types ----

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

// BYOA Pipeline
export type AgentKind = "Claude" | "Codex";

export interface AgentAvailability {
  kind: AgentKind;
  binaryPath: string | null;
  version: string | null;
  available: boolean;
}

export interface AgentInvocation {
  kind: AgentKind;
  prompt: string;
  timeoutSecs: number;
  requestJsonOutput: boolean;
}

export interface AgentResult {
  kind: AgentKind;
  exitCode: number;
  stdout: string;
  stderr: string;
  parsedJson: unknown | null;
  durationMs: number;
  timedOut: boolean;
}

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

// Crawl Pipeline
export type CrawlSource = "GitHub" | "HackerNews" | "Reddit" | "LinuxDo" | "Curated";
export type ItemType = "Repository" | "Discussion" | "Article";

export interface CrawlItem {
  id: string;
  title: string;
  url: string;
  source: CrawlSource;
  itemType: ItemType;
  score: number | null;
  summary: string | null;
  author: string | null;
  createdAt: string | null;
  relevance: number | null;
}

export interface CrawlResult {
  source: CrawlSource;
  items: CrawlItem[];
  crawledAt: string;
  filterKeywords: string[];
  error: string | null;
}

export interface CrawlSummary {
  results: CrawlResult[];
  totalRaw: number;
  totalFiltered: number;
  totalRanked: number;
  agentUsed: AgentKind | null;
}

// Target Adapter
export interface TargetInfo {
  kind: string;
  displayName: string;
  available: boolean;
  skillsCount: number;
  configPath: string | null;
}

// Install
export type InstallTarget = "ClaudeCode" | "Codex";
export type InstallAction = "CopySkill" | "AppendRule" | "AddMcpServer";

export interface InstallRequest {
  sourceUrl: string;
  target: InstallTarget;
  action: InstallAction;
  skillName: string;
}

export interface InstallResult {
  success: boolean;
  target: InstallTarget;
  installedPath: string;
  message: string;
}

// App config
export interface AppConfig {
  registryLocalPath: string | null;
}

// Suggestion persistence
export type SuggestionStatus = "Pending" | "Accepted" | "Dismissed";
export type SuggestionAction = "CopySkill" | "AppendRule" | "AddMcpServer";

export interface ProposedChange {
  target: InstallTarget;
  action: SuggestionAction;
  skillName: string;
  content: string;
  targetPath: string;
}

export interface OptimizationSuggestion {
  id: string;
  insightId: string;
  description: string;
  proposedChange: ProposedChange;
  confidence: number;
  status: SuggestionStatus;
  createdAt: string;
  resolvedAt: string | null;
}

// Install history
export interface InstallHistoryEntry {
  id: string;
  suggestionId: string | null;
  skillName: string;
  target: InstallTarget;
  installedPath: string;
  backupPath: string | null;
  installedAt: string;
  reverted: boolean;
  revertedAt: string | null;
}

// Hone data model
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

export interface RegistryConnection {
  id: string;
  path: string;
  registryType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  outcome: string;
  createdAt: string;
}

// System Practice Skills
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

export interface AdoptResult {
  assetId: string;
  registryPath: string;
  backupPath: string;
  symlinkPath: string;
}
