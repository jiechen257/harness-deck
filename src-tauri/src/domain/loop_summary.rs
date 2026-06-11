use serde::{Deserialize, Serialize};

use crate::domain::audit::AuditEvent;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoopMetric {
    pub label_zh: String,
    pub label_en: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoopSection {
    pub id: String,
    pub name_zh: String,
    pub name_en: String,
    pub count: usize,
    pub caption_zh: String,
    pub caption_en: String,
    pub metrics: Vec<LoopMetric>,
    pub action_zh: String,
    pub action_en: String,
    pub view: String,
    pub tone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoopDecision {
    pub title_zh: String,
    pub title_en: String,
    pub detail_zh: String,
    pub detail_en: String,
    pub count: usize,
    pub severity: String,
    pub view: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetHealthSummary {
    pub name: String,
    pub detail: String,
    pub score: u8,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoopSummary {
    pub health_score: u8,
    pub sections: Vec<LoopSection>,
    pub decisions: Vec<LoopDecision>,
    pub targets: Vec<TargetHealthSummary>,
    pub recent_audits: Vec<AuditEvent>,
    pub updated_at: String,
    pub fixture_mode: bool,
}
