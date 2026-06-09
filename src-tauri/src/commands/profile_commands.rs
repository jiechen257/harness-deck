use crate::domain::errors::CommandError;
use crate::domain::profile::{HarnessProfile, ProfileSummary, ValidationReport};
use crate::services::privacy_service::scan_profile_for_secrets;
use crate::services::profile_service::{
    build_real_profiles, get_fixture_profile, list_profile_summaries, validate_profile,
};

#[tauri::command]
pub fn list_profiles() -> Vec<ProfileSummary> {
    let real = build_real_profiles();
    if real.is_empty() {
        list_profile_summaries()
    } else {
        real
    }
}

#[tauri::command]
pub fn get_profile(profile_id: String) -> Result<HarnessProfile, CommandError> {
    get_fixture_profile(&profile_id)
        .ok_or_else(|| CommandError::validation(format!("unknown profile id: {profile_id}")))
}

#[tauri::command]
pub fn validate_profile_command(profile_id: String) -> Result<ValidationReport, CommandError> {
    let profile = get_profile(profile_id)?;
    let findings = scan_profile_for_secrets(&profile);
    if !findings.is_empty() {
        return Ok(ValidationReport {
            valid: false,
            messages: findings
                .into_iter()
                .map(|finding| format!("secret-like value detected at {}", finding.field))
                .collect(),
        });
    }
    Ok(validate_profile(&profile))
}
