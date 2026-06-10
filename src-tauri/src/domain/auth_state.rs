use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationEntry {
    pub scope: String,
    pub granted: bool,
    pub granted_at: Option<String>,
    pub revoked_at: Option<String>,
}
