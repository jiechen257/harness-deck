use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ActionType {
    Create,
    Update,
    Skip,
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ProjectionMode {
    Symlink,
    Copy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionAction {
    pub asset_id: String,
    pub asset_name: String,
    pub registry_path: String,
    pub target_path: String,
    pub mode: ProjectionMode,
    pub action: ActionType,
    pub conflict_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionPlan {
    pub target_kind: String,
    pub actions: Vec<ProjectionAction>,
    pub creates: usize,
    pub updates: usize,
    pub skips: usize,
    pub conflicts: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthFinding {
    pub finding_type: String,
    pub severity: String,
    pub asset_id: Option<String>,
    pub target_path: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdoptRequest {
    pub target_path: String,
    pub registry_dest: String,
    pub asset_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdoptResult {
    pub asset_id: String,
    pub registry_path: String,
    pub backup_path: String,
    pub symlink_path: String,
}
