use serde::{Deserialize, Serialize};

use super::adapter::TargetKind;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperationType {
    CreateFile,
    UpdateFile,
    AppendBlock,
    ReplaceBlock,
    Noop,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeployOperation {
    pub id: String,
    pub operation_type: OperationType,
    pub path: String,
    pub reason: String,
    pub before_summary: String,
    pub after_summary: String,
    pub risk: RiskLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeployPlan {
    pub id: String,
    pub profile_id: String,
    pub target_kind: TargetKind,
    pub dry_run: bool,
    pub risk: RiskLevel,
    pub operations: Vec<DeployOperation>,
}
