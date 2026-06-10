use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshRecord {
    pub id: String,
    pub source_name: String,
    pub source_url: Option<String>,
    pub triggered_by: String,
    pub result_count: Option<i32>,
    pub error_message: Option<String>,
    pub outcome: String,
    pub started_at: String,
    pub finished_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewRefreshRecord {
    pub source_name: String,
    pub source_url: Option<String>,
    pub triggered_by: String,
    pub result_count: Option<i32>,
    pub error_message: Option<String>,
    pub outcome: String,
    pub started_at: String,
    pub finished_at: Option<String>,
}
