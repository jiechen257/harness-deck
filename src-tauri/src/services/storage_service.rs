use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::domain::deploy_plan::DeployPlan;
use crate::domain::manifest::{DeploymentManifest, ManifestSummary};
use crate::domain::errors::CommandError;
use crate::services::app_paths::HarnessDeckPaths;

pub fn write_dry_run_manifest(
    paths: &HarnessDeckPaths,
    plan: &DeployPlan,
) -> Result<ManifestSummary, CommandError> {
    paths.ensure()?;
    let created_at = timestamp()?;
    let manifest = DeploymentManifest {
        id: format!("manifest-{}-{}", plan.profile_id, created_at),
        created_at,
        profile_id: plan.profile_id.clone(),
        target_kind: plan.target_kind,
        dry_run: true,
        operation_count: plan.operations.len(),
        plan_summary: format!(
            "{} dry-run operations for {:?}",
            plan.operations.len(),
            plan.target_kind
        ),
        backup_policy: "backup-required-before-real-write".to_string(),
    };
    let path = paths.manifests.join(format!("{}.json", manifest.id));
    let body = serde_json::to_string_pretty(&manifest)
        .map_err(|error| CommandError::storage(error.to_string()))?;

    fs::write(path, body)?;

    Ok(ManifestSummary::from(&manifest))
}

pub fn latest_manifest(paths: &HarnessDeckPaths) -> Result<Option<ManifestSummary>, CommandError> {
    paths.ensure()?;
    let mut manifests = Vec::new();

    for entry in fs::read_dir(&paths.manifests)? {
        let entry = entry?;
        if entry.path().extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let body = fs::read_to_string(entry.path())?;
        let manifest: DeploymentManifest = serde_json::from_str(&body)
            .map_err(|error| CommandError::storage(error.to_string()))?;
        manifests.push(manifest);
    }

    manifests.sort_by(|left, right| left.created_at.cmp(&right.created_at));
    Ok(manifests.last().map(ManifestSummary::from))
}

fn timestamp() -> Result<String, CommandError> {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| CommandError::storage(error.to_string()))?
        .as_millis();
    Ok(millis.to_string())
}
