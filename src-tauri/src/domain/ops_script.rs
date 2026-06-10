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
