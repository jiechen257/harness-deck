use serde::{Deserialize, Serialize};

use super::adapter::TargetKind;
use super::deploy_plan::RiskLevel;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncGovernance {
    pub profile_id: String,
    pub target_kind: TargetKind,
    pub three_way_diff: Vec<DiffEntry>,
    pub conflicts: Vec<ConflictItem>,
    pub drift: DriftReport,
    pub rollback_preview: RollbackPreview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffEntry {
    pub path: String,
    pub base_summary: String,
    pub target_summary: String,
    pub planned_summary: String,
    pub risk: RiskLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictItem {
    pub id: String,
    pub path: String,
    pub summary: String,
    pub resolution: String,
    pub risk: RiskLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriftReport {
    pub detected: bool,
    pub count: usize,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RollbackPreview {
    pub backup_required: bool,
    pub manifest_required: bool,
    pub rollback_available_after_real_write: bool,
    pub summary: String,
}
