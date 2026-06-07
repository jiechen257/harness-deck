use serde::{Deserialize, Serialize};

use crate::domain::profile::HarnessProfile;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecretFinding {
    pub field: String,
    pub pattern: String,
}

pub fn scan_profile_for_secrets(profile: &HarnessProfile) -> Vec<SecretFinding> {
    let mut findings = Vec::new();

    for rule in &profile.rules {
        if secret_pattern(&rule.body).is_some() {
            findings.push(SecretFinding {
                field: format!("rules.{}.body", rule.id),
                pattern: "token-like".to_string(),
            });
        }
    }

    findings
}

fn secret_pattern(value: &str) -> Option<&'static str> {
    let lower = value.to_ascii_lowercase();
    if lower.contains("bearer ")
        || lower.contains("api_key")
        || lower.contains("private key")
        || lower.contains("token=")
        || lower.contains("sk-")
    {
        Some("token-like")
    } else {
        None
    }
}
