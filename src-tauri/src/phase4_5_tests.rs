use crate::domain::usage::DataConfidence;
use crate::services::account_service::{fixture_account_workspace, preview_account_switch};
use crate::services::usage_service::{confidence_label, local_usage_summary};

#[test]
fn account_workspace_uses_keychain_reference_without_secret_value() {
    let workspace = fixture_account_workspace();

    assert_eq!(workspace.provider, "OpenAI");
    assert!(workspace.keychain_ref.reference.starts_with("keychain://HarnessDeck"));
    assert!(!workspace.keychain_ref.secret_value_stored);
    assert!(workspace.keychain_ref.secret_preview.is_none());
    assert!(workspace
        .audit_trail
        .iter()
        .any(|entry| entry.summary.contains("mock Keychain reference")));
}

#[test]
fn account_switch_preview_keeps_secret_reference_unchanged() {
    let workspace = fixture_account_workspace();
    let preview = preview_account_switch(&workspace, "gpt-5-codex-high-context");

    assert_eq!(preview.provider, workspace.provider);
    assert_eq!(preview.from_model, workspace.default_model);
    assert_eq!(preview.to_model, "gpt-5-codex-high-context");
    assert_eq!(preview.keychain_reference, workspace.keychain_ref.reference);
    assert!(!preview.requires_secret_value);
}

#[test]
fn usage_summary_exposes_aggregation_and_confidence_labels() {
    let summary = local_usage_summary();

    assert_eq!(summary.window_hours, 5);
    assert!(summary.metrics.iter().any(|metric| metric.confidence == DataConfidence::LocalLog));
    assert!(summary.metrics.iter().any(|metric| metric.confidence == DataConfidence::Estimated));
    assert!(summary.metrics.iter().any(|metric| metric.confidence == DataConfidence::Missing));
    assert!(summary.cost_usd > 0.0);
    assert_eq!(confidence_label(DataConfidence::Missing), "Missing");
}
