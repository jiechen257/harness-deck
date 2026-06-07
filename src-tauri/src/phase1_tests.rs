use crate::domain::adapter::TargetKind;
use crate::domain::profile::HarnessProfile;
use crate::services::adapter_service::plan_deploy;
use crate::services::app_paths::HarnessDeckPaths;
use crate::services::privacy_service::scan_profile_for_secrets;
use crate::services::profile_service::{get_fixture_profile, list_fixture_profiles, validate_profile};
use crate::services::storage_service::{latest_manifest, write_dry_run_manifest};

#[test]
fn sample_profile_validates_successfully() {
    let profiles = list_fixture_profiles();

    assert!(!profiles.is_empty());
    assert!(profiles.iter().any(|profile| profile.id == "macos-dev"));

    let report = validate_profile(&profiles[0]);
    assert!(report.valid, "sample profile should validate: {report:?}");
    assert!(report.messages.iter().any(|message| message.contains("rules")));
}

#[test]
fn profile_validation_rejects_missing_required_fields() {
    let profile = HarnessProfile {
        id: "".to_string(),
        name: "".to_string(),
        description: "".to_string(),
        rules: vec![],
        skills: vec![],
        mcp_references: vec![],
        targets: vec![],
        sync_policy: Default::default(),
        metadata: Default::default(),
    };

    let report = validate_profile(&profile);

    assert!(!report.valid);
    assert!(report.messages.iter().any(|message| message.contains("id")));
    assert!(report.messages.iter().any(|message| message.contains("rules")));
}

#[test]
fn secret_scanner_catches_token_like_profile_content() {
    let mut profile = get_fixture_profile("macos-dev").expect("fixture profile should exist");
    profile.rules.push(crate::domain::profile::RuleEntry {
        id: "unsafe-token".to_string(),
        title: "Unsafe token".to_string(),
        body: "Authorization: Bearer sk-test-1234567890".to_string(),
    });

    let findings = scan_profile_for_secrets(&profile);

    assert_eq!(findings.len(), 1);
    assert_eq!(findings[0].field, "rules.unsafe-token.body");
}

#[test]
fn codex_fixture_plan_contains_dry_run_operations() {
    let profile = get_fixture_profile("macos-dev").expect("fixture profile should exist");

    let plan = plan_deploy(&profile, TargetKind::Codex).expect("deploy plan should be generated");

    assert!(plan.dry_run);
    assert_eq!(plan.profile_id, "macos-dev");
    assert_eq!(plan.target_kind, TargetKind::Codex);
    assert!(plan.operations.iter().any(|operation| operation.path.ends_with("AGENTS.md")));
    assert!(plan.operations.iter().any(|operation| operation.reason.contains("rules")));
}

#[test]
fn dry_run_manifest_writes_and_reads_latest_summary() {
    let base = std::env::temp_dir().join(format!(
        "harnessdeck-manifest-test-{}",
        std::process::id()
    ));
    let paths = HarnessDeckPaths::for_base(base.clone());
    paths.ensure().expect("paths should be created");
    let profile = get_fixture_profile("macos-dev").expect("fixture profile should exist");
    let plan = plan_deploy(&profile, TargetKind::ClaudeCode).expect("deploy plan should be generated");

    let written = write_dry_run_manifest(&paths, &plan).expect("manifest should be written");
    let latest = latest_manifest(&paths).expect("latest lookup should not fail");

    assert!(written.dry_run);
    assert_eq!(latest.expect("latest manifest should exist").id, written.id);

    std::fs::remove_dir_all(base).expect("test directory should be removable");
}
