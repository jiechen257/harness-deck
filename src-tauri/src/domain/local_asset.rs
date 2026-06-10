use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalAsset {
    pub id: String,
    pub practice_id: Option<String>,
    pub asset_type: String,
    pub registry_path: String,
    pub checksum: Option<String>,
    pub is_system: bool,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewLocalAsset {
    pub practice_id: Option<String>,
    pub asset_type: String,
    pub registry_path: String,
    pub checksum: Option<String>,
    pub is_system: bool,
}
