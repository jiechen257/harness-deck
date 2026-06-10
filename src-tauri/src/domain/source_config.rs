use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceConfig {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub source_tier: String,
    pub url: Option<String>,
    pub enabled: bool,
    pub auto_refresh: bool,
    pub updated_at: String,
}
