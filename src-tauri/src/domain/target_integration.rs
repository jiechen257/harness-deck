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
    pub config_summary: Option<TargetConfigSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetConfigSummary {
    pub model: Option<String>,
    pub editor_mode: Option<String>,
    pub theme: Option<String>,
    pub mcp_server_count: usize,
    pub skill_count: usize,
    pub hook_count: usize,
    pub permission_allow_count: usize,
    pub permission_deny_count: usize,
    pub plugin_count: usize,
    pub startup_count: usize,
    pub project_count: usize,
    pub version: Option<String>,
}
