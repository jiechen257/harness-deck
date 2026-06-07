use serde::{Deserialize, Serialize};

use super::adapter::TargetKind;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeploymentManifest {
    pub id: String,
    pub created_at: String,
    pub profile_id: String,
    pub target_kind: TargetKind,
    pub dry_run: bool,
    pub operation_count: usize,
    pub plan_summary: String,
    pub backup_policy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestSummary {
    pub id: String,
    pub created_at: String,
    pub profile_id: String,
    pub target_kind: TargetKind,
    pub dry_run: bool,
    pub operation_count: usize,
}

impl From<&DeploymentManifest> for ManifestSummary {
    fn from(manifest: &DeploymentManifest) -> Self {
        Self {
            id: manifest.id.clone(),
            created_at: manifest.created_at.clone(),
            profile_id: manifest.profile_id.clone(),
            target_kind: manifest.target_kind,
            dry_run: manifest.dry_run,
            operation_count: manifest.operation_count,
        }
    }
}
