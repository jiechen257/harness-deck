use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PracticeCard {
    pub id: String,
    pub title: String,
    pub practice_type: String,
    pub summary: Option<String>,
    pub scenarios: Option<String>,
    pub comparable: Option<String>,
    pub applicability: Option<String>,
    pub generated_by: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewPracticeCard {
    pub title: String,
    pub practice_type: String,
    pub summary: Option<String>,
    pub scenarios: Option<String>,
    pub comparable: Option<String>,
    pub applicability: Option<String>,
    pub generated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PracticeDraft {
    pub title: String,
    pub practice_type: String,
    pub summary: String,
    pub scenarios: Vec<String>,
    pub comparable: Vec<String>,
    pub can_generate_asset: bool,
    pub suggested_asset_types: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizeResult {
    pub signal_id: String,
    pub success: bool,
    pub draft: Option<PracticeDraft>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub duration_ms: Option<u64>,
}
