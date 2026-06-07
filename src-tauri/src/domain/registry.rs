use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrySkillTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub task_tags: Vec<String>,
    pub quality_score: f64,
    pub community_signal: f64,
    pub personal_feedback: f64,
    pub safety_risk: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillScoreBreakdown {
    pub task_match: f64,
    pub quality: f64,
    pub community: f64,
    pub personal: f64,
    pub safety_penalty: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FindBestSkillResult {
    pub task: String,
    pub recommended_skill: RegistrySkillTemplate,
    pub score: f64,
    pub scoring: SkillScoreBreakdown,
    pub github_discovery_enabled: bool,
    pub remote_call_performed: bool,
    pub safety_summary: String,
}
