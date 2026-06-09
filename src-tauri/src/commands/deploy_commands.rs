use tauri::AppHandle;

use crate::domain::adapter::TargetKind;
use crate::domain::deploy_plan::{DeployPlan, RiskLevel};
use crate::domain::errors::CommandError;
use crate::domain::manifest::ManifestSummary;
use crate::domain::sync_governance::SyncGovernance;
use crate::services::adapter_service::plan_deploy;
use crate::services::app_paths::paths_for_app;
use crate::services::privacy_service::scan_profile_for_secrets;
use crate::services::profile_service::get_fixture_profile;
use crate::services::storage_service::{latest_manifest, write_dry_run_manifest};
use crate::services::sync_governance_service::real_sync_governance;

#[tauri::command]
pub fn generate_deploy_plan(
    profile_id: String,
    target_kind: TargetKind,
) -> Result<DeployPlan, CommandError> {
    let profile = get_fixture_profile(&profile_id)
        .ok_or_else(|| CommandError::validation(format!("unknown profile id: {profile_id}")))?;
    let findings = scan_profile_for_secrets(&profile);
    if !findings.is_empty() {
        return Err(CommandError::validation(format!(
            "secret-like value detected at {}",
            findings[0].field
        )));
    }

    plan_deploy(&profile, target_kind)
}

#[tauri::command]
pub fn confirm_dry_run_deploy(
    app: AppHandle,
    plan: DeployPlan,
) -> Result<ManifestSummary, CommandError> {
    if !plan.dry_run {
        return Err(CommandError::plan_blocked("only dry-run deployment is available"));
    }
    if matches!(plan.risk, RiskLevel::High | RiskLevel::Blocked) {
        return Err(CommandError::plan_blocked("high or blocked plans cannot be confirmed"));
    }
    let paths = paths_for_app(&app)?;
    write_dry_run_manifest(&paths, &plan)
}

#[tauri::command]
pub fn get_latest_manifest(app: AppHandle) -> Result<Option<ManifestSummary>, CommandError> {
    let paths = paths_for_app(&app)?;
    latest_manifest(&paths)
}

#[tauri::command]
pub fn get_sync_governance(profile_id: String, target_kind: TargetKind) -> SyncGovernance {
    real_sync_governance(&profile_id, target_kind)
}
