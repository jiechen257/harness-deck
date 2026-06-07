use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountWorkspace {
    pub provider: String,
    pub base_url: String,
    pub default_model: String,
    pub monthly_budget_usd: f64,
    pub request_limit_per_day: u32,
    pub token_limit_per_day: u32,
    pub keychain_ref: KeychainReference,
    pub switch_plan_preview: AccountSwitchPreview,
    pub audit_trail: Vec<AuditEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeychainReference {
    pub reference: String,
    pub service: String,
    pub account: String,
    pub secret_value_stored: bool,
    pub secret_preview: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSwitchPreview {
    pub provider: String,
    pub from_model: String,
    pub to_model: String,
    pub budget_delta_usd: f64,
    pub keychain_reference: String,
    pub requires_secret_value: bool,
    pub writes_real_config: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub created_at: String,
    pub summary: String,
    pub severity: String,
}
