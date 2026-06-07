use std::time::{SystemTime, UNIX_EPOCH};

use crate::domain::adapter::{TargetKind, TargetSummary};
use crate::domain::deploy_plan::{DeployOperation, DeployPlan, OperationType, RiskLevel};
use crate::domain::profile::HarnessProfile;
use crate::domain::errors::CommandError;

pub fn list_fixture_targets() -> Vec<TargetSummary> {
    vec![
        TargetSummary {
            kind: TargetKind::Codex,
            name: "Codex fixture".to_string(),
            fixture: true,
            status: "dry-run only".to_string(),
        },
        TargetSummary {
            kind: TargetKind::ClaudeCode,
            name: "Claude Code fixture".to_string(),
            fixture: true,
            status: "dry-run only".to_string(),
        },
    ]
}

pub fn plan_deploy(profile: &HarnessProfile, target_kind: TargetKind) -> Result<DeployPlan, CommandError> {
    if !profile.targets.contains(&target_kind) {
        return Err(CommandError::validation(format!(
            "profile {} does not apply to target {:?}",
            profile.id, target_kind
        )));
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| CommandError::storage(error.to_string()))?
        .as_millis();
    let target_path = match target_kind {
        TargetKind::Codex => "~/.codex/AGENTS.md",
        TargetKind::ClaudeCode => "~/.claude/CLAUDE.md",
    };

    Ok(DeployPlan {
        id: format!("plan-{}-{:?}-{timestamp}", profile.id, target_kind).to_ascii_lowercase(),
        profile_id: profile.id.clone(),
        target_kind,
        dry_run: true,
        risk: RiskLevel::Medium,
        operations: vec![
            DeployOperation {
                id: "validate-profile".to_string(),
                operation_type: OperationType::Noop,
                path: "fixture://profile".to_string(),
                reason: "validate profile rules, skills, MCP references, and sync policy".to_string(),
                before_summary: "profile fixture loaded".to_string(),
                after_summary: "schema valid, secret scan clean".to_string(),
                risk: RiskLevel::Low,
            },
            DeployOperation {
                id: "append-rules".to_string(),
                operation_type: OperationType::AppendBlock,
                path: target_path.to_string(),
                reason: "append scoped rules block from Harness Profile rules".to_string(),
                before_summary: "fixture target rules snapshot".to_string(),
                after_summary: format!("{} rules staged for dry-run", profile.rules.len()),
                risk: RiskLevel::Medium,
            },
            DeployOperation {
                id: "copy-skills".to_string(),
                operation_type: OperationType::CreateFile,
                path: "fixture://skills".to_string(),
                reason: "copy skill references into deploy manifest only".to_string(),
                before_summary: "no real skill files touched".to_string(),
                after_summary: format!("{} skill references recorded", profile.skills.len()),
                risk: RiskLevel::Low,
            },
            DeployOperation {
                id: "mcp-policy".to_string(),
                operation_type: OperationType::Noop,
                path: "fixture://mcp".to_string(),
                reason: "MCP references remain target-specific overrides in fixture mode".to_string(),
                before_summary: "fixture MCP state".to_string(),
                after_summary: format!("{} MCP references retained", profile.mcp_references.len()),
                risk: RiskLevel::Low,
            },
        ],
    })
}
