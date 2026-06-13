use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpsScript {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub risk_level: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewOpsScript {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpsScriptPreview {
    pub script_id: String,
    pub name: String,
    pub path: String,
    pub risk_level: String,
    pub steps: Vec<String>,
    pub requires_authorization: String,
    pub will_execute: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpsScriptExecutionResult {
    pub script_id: String,
    pub status: String,
    pub audit_event_type: String,
    pub message: String,
}
