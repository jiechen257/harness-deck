use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSkillMeta {
    pub id: String,
    pub version: String,
    pub description: String,
    pub output_type: String,
    pub enabled: bool,
    pub template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillConfig {
    pub skill_id: String,
    pub enabled: bool,
    pub version: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillExecutionResult {
    pub skill_id: String,
    pub agent_kind: String,
    pub output_json: Option<String>,
    pub duration_ms: u64,
    pub success: bool,
    pub error: Option<String>,
}
