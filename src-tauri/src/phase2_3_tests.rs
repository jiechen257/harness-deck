use crate::domain::adapter::TargetKind;
use crate::services::sync_governance_service::build_sync_governance;
use crate::services::target_integration_service::discover_real_targets;

#[test]
fn target_discovery_requires_explicit_local_read_authorization() {
    let result = discover_real_targets(false);

    assert!(result.is_err());
    let error = result.expect_err("unauthorized discovery should fail");
    assert_eq!(error.code, "AuthorizationRequired");
}

#[test]
fn authorized_target_discovery_returns_safe_summaries_only() {
    let summaries = discover_real_targets(true).expect("authorized discovery should return summaries");

    assert!(summaries.iter().any(|summary| summary.kind == TargetKind::Codex));
    assert!(summaries.iter().any(|summary| summary.kind == TargetKind::ClaudeCode));
    assert!(summaries.iter().all(|summary| summary.raw_config_preview.is_none()));
}

#[test]
fn sync_governance_exposes_diff_conflict_drift_and_rollback_preview() {
    let governance = build_sync_governance("macos-dev", TargetKind::Codex);

    assert!(governance.three_way_diff.iter().any(|entry| entry.path.ends_with("AGENTS.md")));
    assert!(!governance.conflicts.is_empty());
    assert!(governance.drift.detected);
    assert!(governance.rollback_preview.backup_required);
}
