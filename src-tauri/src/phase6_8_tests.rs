use crate::domain::wake_control::WakeMode;
use crate::services::insight_service::{high_priority_feed, local_feed, local_insights};
use crate::services::registry_service::{curated_registry_templates, find_best_skill};
use crate::services::wake_service::{request_wake_mode, wake_control_summary};

#[test]
fn find_best_skill_scores_task_match_quality_and_safety() {
    let templates = curated_registry_templates();
    let recommendation = find_best_skill("sync Claude Code and Codex rules safely", false);

    assert!(templates.iter().any(|template| template.name == "Tauri Desktop Guardrails"));
    assert_eq!(recommendation.recommended_skill.name, "Tauri Desktop Guardrails");
    assert!(recommendation.scoring.task_match >= 0.8);
    assert_eq!(recommendation.recommended_skill.safety_risk, "Low");
    assert!(!recommendation.remote_call_performed);
}

#[test]
fn local_insights_and_feed_include_profile_impact_items() {
    let insights = local_insights();
    let feed = local_feed();
    let high_priority = high_priority_feed();

    assert!(insights.iter().any(|insight| insight.title == "Token anomaly"));
    assert!(insights.iter().any(|insight| insight.title == "Profile drift"));
    assert!(feed.iter().any(|item| item.profile_impact));
    assert!(high_priority.iter().all(|item| item.priority == "High"));
}

#[test]
fn wake_control_uses_mock_controls_and_confirms_experimental_lid_awake() {
    let summary = wake_control_summary();

    assert!(summary.quick_actions.iter().any(|session| session.mode == WakeMode::StandardAwake));
    assert!(summary.quick_actions.iter().any(|session| session.mode == WakeMode::TimedAwake));
    assert!(summary.quick_actions.iter().any(|session| session.mode == WakeMode::DisplaySleep));

    let blocked = request_wake_mode(WakeMode::ExperimentalLidAwake, false);
    assert!(blocked.is_err());
    assert_eq!(blocked.expect_err("confirmation should be required").code, "AuthorizationRequired");

    let confirmed = request_wake_mode(WakeMode::ExperimentalLidAwake, true)
        .expect("confirmed experimental mode returns mock session");
    assert!(confirmed.confirmed);
    assert!(confirmed.experimental);
    assert_eq!(confirmed.implementation, "mock/system-safe");
}
