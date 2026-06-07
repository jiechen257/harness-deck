use serde::{Deserialize, Serialize};

use super::adapter::TargetKind;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetDiscoverySummary {
    pub kind: TargetKind,
    pub name: String,
    pub discovered: bool,
    pub candidate_paths: Vec<String>,
    pub schema_status: String,
    pub raw_config_preview: Option<String>,
}
