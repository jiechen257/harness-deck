use serde::{Deserialize, Serialize};

use super::adapter::TargetKind;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub rules: Vec<RuleEntry>,
    pub skills: Vec<SkillRef>,
    pub mcp_references: Vec<McpReference>,
    pub targets: Vec<TargetKind>,
    pub sync_policy: SyncPolicy,
    pub metadata: ProfileMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleEntry {
    pub id: String,
    pub title: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRef {
    pub id: String,
    pub name: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpReference {
    pub id: String,
    pub name: String,
    pub transport: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPolicy {
    pub rules: String,
    pub skills: String,
    pub mcp_references: String,
    pub real_writes_allowed: bool,
}

impl Default for SyncPolicy {
    fn default() -> Self {
        Self {
            rules: "append-scoped-block".to_string(),
            skills: "copy-reference".to_string(),
            mcp_references: "target-override".to_string(),
            real_writes_allowed: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileMetadata {
    pub version: String,
    pub source: String,
    pub updated_at: String,
}

impl Default for ProfileMetadata {
    fn default() -> Self {
        Self {
            version: "0.1.0".to_string(),
            source: "fixture".to_string(),
            updated_at: "2026-06-07".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileSummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub rules: usize,
    pub skills: usize,
    pub mcp_references: usize,
    pub targets: Vec<TargetKind>,
}

impl From<&HarnessProfile> for ProfileSummary {
    fn from(profile: &HarnessProfile) -> Self {
        Self {
            id: profile.id.clone(),
            name: profile.name.clone(),
            description: profile.description.clone(),
            rules: profile.rules.len(),
            skills: profile.skills.len(),
            mcp_references: profile.mcp_references.len(),
            targets: profile.targets.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationReport {
    pub valid: bool,
    pub messages: Vec<String>,
}
