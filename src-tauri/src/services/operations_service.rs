use crate::db::Database;
use crate::domain::audit::NewAuditEvent;
use crate::domain::errors::CommandError;
use crate::domain::ops_script::{
    NewOpsScript, OpsScript, OpsScriptExecutionResult, OpsScriptPreview,
};

const DEFAULT_OPS_SCRIPTS: &[(&str, &str, &str, &str)] = &[
    (
        "Codex proxy",
        "~/start-codex.sh",
        "launchctl environment and Codex restart control",
        "high",
    ),
    (
        "Sleep guard",
        "~/dsleep",
        "caffeinate guard with stop boundary",
        "medium",
    ),
    (
        "Wake display",
        "~/dwake",
        "pmset displaysleepnow quick action",
        "medium",
    ),
];

pub fn ensure_default_ops_scripts(db: &Database) -> Result<Vec<OpsScript>, CommandError> {
    let existing = db.list_ops_scripts()?;

    for (name, path, description, risk_level) in DEFAULT_OPS_SCRIPTS {
        if !existing.iter().any(|script| script.name == *name) {
            db.insert_ops_script(&NewOpsScript {
                name: (*name).into(),
                path: (*path).into(),
                description: Some((*description).into()),
                risk_level: (*risk_level).into(),
            })?;
        }
    }

    db.list_ops_scripts()
}

pub fn list_scripts(db: &Database) -> Result<Vec<OpsScript>, CommandError> {
    ensure_default_ops_scripts(db)
}

pub fn preview_script(db: &Database, script_id: &str) -> Result<OpsScriptPreview, CommandError> {
    ensure_default_ops_scripts(db)?;
    let script = db.get_ops_script(script_id)?;
    Ok(OpsScriptPreview {
        script_id: script.id,
        name: script.name,
        path: script.path,
        risk_level: script.risk_level,
        steps: vec![
            "Resolve script path and show the intended command boundary".into(),
            "Check script_execution authorization before confirmation".into(),
            "Record an audit event for the confirmed operation".into(),
            "Keep shell execution disabled in the current safe MVP".into(),
        ],
        requires_authorization: "script_execution".into(),
        will_execute: false,
    })
}

pub fn confirm_script(
    db: &Database,
    script_id: &str,
) -> Result<OpsScriptExecutionResult, CommandError> {
    db.require_authorization("script_execution")?;
    ensure_default_ops_scripts(db)?;
    let script = db.get_ops_script(script_id)?;

    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "ops_script_confirmed".into(),
        entity_type: Some("ops_script".into()),
        entity_id: Some(script.id.clone()),
        detail: Some(format!(
            "{{\"name\":\"{}\",\"path\":\"{}\",\"risk\":\"{}\",\"executed\":false}}",
            script.name, script.path, script.risk_level
        )),
        outcome: "success".into(),
    });

    Ok(OpsScriptExecutionResult {
        script_id: script.id,
        status: "confirmed_safe_mvp".into(),
        audit_event_type: "ops_script_confirmed".into(),
        message: "Authorization accepted and audit recorded; shell execution is disabled in the current safe MVP.".into(),
    })
}
