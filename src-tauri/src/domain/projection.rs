use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Projection {
    pub id: String,
    pub asset_id: String,
    pub target_kind: String,
    pub target_path: String,
    pub mode: String,
    pub status: String,
    pub last_checked: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewProjection {
    pub asset_id: String,
    pub target_kind: String,
    pub target_path: String,
    pub mode: String,
}
