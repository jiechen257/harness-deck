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
pub struct ProjectionExecutionResult {
    pub target_kind: String,
    pub executed_projection_ids: Vec<String>,
    pub skipped: usize,
    pub conflicts: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionTarget {
    pub target_kind: String,
    pub label: String,
    pub target_path: String,
    pub exists: bool,
    pub recommended: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffPayload {
    pub source_path: String,
    pub target_path: String,
    pub source_exists: bool,
    pub target_exists: bool,
    pub source_text: Option<String>,
    pub target_text: Option<String>,
    pub diff_hunks: Vec<String>,
    pub read_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriftTimelineItem {
    pub id: String,
    pub asset_id: String,
    pub target_kind: String,
    pub target_path: String,
    pub status: String,
    pub first_detected_at: Option<String>,
    pub last_checked_at: Option<String>,
    pub related_event: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdapterCapability {
    pub target_kind: String,
    pub label: String,
    pub detect: bool,
    pub read_config: bool,
    pub preview_projection: bool,
    pub write_projection: bool,
    pub rollback: bool,
    pub health_check: bool,
    pub supported: bool,
    pub note: String,
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
