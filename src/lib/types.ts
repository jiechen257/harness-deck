export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "Codex" | "ClaudeCode";
export type OperationType = "CreateFile" | "UpdateFile" | "AppendBlock" | "ReplaceBlock" | "Noop";
export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";

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
