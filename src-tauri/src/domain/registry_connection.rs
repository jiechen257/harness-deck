use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryConnection {
    pub id: String,
    pub path: String,
    pub registry_type: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewRegistryConnection {
    pub path: String,
    pub registry_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryCandidate {
    pub path: String,
    pub registry_type: String,
    pub exists: bool,
    pub writable: bool,
    pub read_only: bool,
    pub active: bool,
    pub reason: String,
}
