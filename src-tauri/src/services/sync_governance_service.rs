use std::collections::BTreeSet;

use crate::domain::adapter::TargetKind;
use crate::domain::deploy_plan::RiskLevel;
use crate::domain::sync_governance::{
    ConflictItem, DiffEntry, DriftReport, RollbackPreview, SyncGovernance,
};
use crate::readers;

/// Build sync governance from real Claude Code and Codex configurations.
/// Falls back to fixture data if neither config directory exists.
pub fn real_sync_governance(profile_id: &str, target_kind: TargetKind) -> SyncGovernance {
    let claude = readers::claude_reader::read_claude_config();
    let codex = readers::codex_reader::read_codex_config();

    // If neither config exists, fall back to fixture data
    if claude.is_none() && codex.is_none() {
        return build_sync_governance(profile_id, target_kind);
    }

    let claude_mcp: BTreeSet<String> = claude
        .as_ref()
        .map(|c| c.mcp_server_names.iter().cloned().collect())
        .unwrap_or_default();
    let codex_mcp: BTreeSet<String> = codex
        .as_ref()
        .map(|c| c.mcp_server_names.iter().cloned().collect())
        .unwrap_or_default();

    let shared: BTreeSet<&String> = claude_mcp.intersection(&codex_mcp).collect();
    let claude_only: BTreeSet<&String> = claude_mcp.difference(&codex_mcp).collect();
    let codex_only: BTreeSet<&String> = codex_mcp.difference(&claude_mcp).collect();

    // --- Three-way diff entries ---
    let mut diff_entries: Vec<DiffEntry> = Vec::new();

    // 1. MCP server diff
    diff_entries.push(DiffEntry {
        path: "MCP servers".to_string(),
        base_summary: format!(
            "Claude Code: {} servers · Codex: {} servers",
            claude_mcp.len(),
            codex_mcp.len()
        ),
        target_summary: if shared.is_empty() {
            "no shared MCP servers".to_string()
        } else {
            format!("{} shared: {}", shared.len(), format_names(&shared))
        },
        planned_summary: if claude_only.is_empty() && codex_only.is_empty() {
            "MCP servers fully aligned".to_string()
        } else {
            let mut parts = Vec::new();
            if !claude_only.is_empty() {
                parts.push(format!(
                    "{} Claude-only ({})",
                    claude_only.len(),
                    format_names(&claude_only)
                ));
            }
            if !codex_only.is_empty() {
                parts.push(format!(
                    "{} Codex-only ({})",
                    codex_only.len(),
                    format_names(&codex_only)
                ));
            }
            parts.join(" · ")
        },
        risk: if claude_only.is_empty() && codex_only.is_empty() {
            RiskLevel::Low
        } else {
            RiskLevel::Medium
        },
    });

    // 2. Permissions / hooks diff
    let claude_perms = claude.as_ref().map(|c| {
        (
            c.permission_allow_count,
            c.permission_deny_count,
            c.hook_count,
        )
    });
    let codex_approval = codex
        .as_ref()
        .and_then(|c| c.approval_policy.clone());
    diff_entries.push(DiffEntry {
        path: "permissions & hooks".to_string(),
        base_summary: match claude_perms {
            Some((allow, deny, hooks)) => {
                format!(
                    "Claude Code: {} allow + {} deny permissions, {} hooks",
                    allow, deny, hooks
                )
            }
            None => "Claude Code: not installed".to_string(),
        },
        target_summary: match &codex_approval {
            Some(policy) => format!("Codex: approval_policy = {}", policy),
            None => match &codex {
                Some(_) => "Codex: no approval_policy set".to_string(),
                None => "Codex: not installed".to_string(),
            },
        },
        planned_summary: "permission models differ by design; review for consistency".to_string(),
        risk: RiskLevel::Low,
    });

    // 3. Model / editor mode diff
    let claude_mode = claude
        .as_ref()
        .and_then(|c| c.editor_mode.clone())
        .unwrap_or_else(|| "unknown".to_string());
    let codex_model = codex
        .as_ref()
        .and_then(|c| c.model.clone())
        .unwrap_or_else(|| "unknown".to_string());
    diff_entries.push(DiffEntry {
        path: "model & mode".to_string(),
        base_summary: format!("Claude Code editor mode: {}", claude_mode),
        target_summary: format!("Codex model: {}", codex_model),
        planned_summary: "model selection is platform-specific; informational only".to_string(),
        risk: RiskLevel::Low,
    });

    // --- Conflicts ---
    let conflicts: Vec<ConflictItem> = shared
        .iter()
        .map(|name| ConflictItem {
            id: format!("mcp-shared-{}", name),
            path: format!("MCP: {}", name),
            summary: format!(
                "\"{}\" registered in both Claude Code and Codex — configs may differ",
                name
            ),
            resolution: "verify server configurations match across platforms".to_string(),
            risk: RiskLevel::Low,
        })
        .collect();

    // --- Drift report ---
    let drift_count = claude_only.len() + codex_only.len();
    let drift = DriftReport {
        detected: drift_count > 0,
        count: drift_count,
        summary: if drift_count == 0 {
            "MCP server lists are fully aligned between Claude Code and Codex".to_string()
        } else {
            format!(
                "{} MCP server(s) differ: {} Claude-only, {} Codex-only",
                drift_count,
                claude_only.len(),
                codex_only.len()
            )
        },
    };

    // --- Rollback preview (informational, no real writes) ---
    let rollback_preview = RollbackPreview {
        backup_required: true,
        manifest_required: true,
        rollback_available_after_real_write: true,
        summary:
            "real write would create backup snapshot and rollback metadata before applying changes"
                .to_string(),
    };

    SyncGovernance {
        profile_id: profile_id.to_string(),
        target_kind,
        three_way_diff: diff_entries,
        conflicts,
        drift,
        rollback_preview,
    }
}

/// Format a set of names into a comma-separated string, truncating if too many.
fn format_names<S: AsRef<str>>(names: &BTreeSet<&S>) -> String {
    let all: Vec<&str> = names.iter().map(|s| s.as_ref().as_ref()).collect();
    if all.len() <= 5 {
        all.join(", ")
    } else {
        let shown: Vec<&str> = all.iter().take(4).copied().collect();
        format!("{} +{} more", shown.join(", "), all.len() - 4)
    }
}

/// Fixture fallback: returns hardcoded sync governance data for demo/testing.
pub fn build_sync_governance(profile_id: &str, target_kind: TargetKind) -> SyncGovernance {
    let target_path = match target_kind {
        TargetKind::Codex => "~/.codex/AGENTS.md",
        TargetKind::ClaudeCode => "~/.claude/CLAUDE.md",
    };

    SyncGovernance {
        profile_id: profile_id.to_string(),
        target_kind,
        three_way_diff: vec![
            DiffEntry {
                path: target_path.to_string(),
                base_summary: "last manifest had 2 managed rules".to_string(),
                target_summary: "fixture target has 1 unmanaged local rule".to_string(),
                planned_summary: "append scoped managed block and keep local override".to_string(),
                risk: RiskLevel::Medium,
            },
            DiffEntry {
                path: "fixture://skills".to_string(),
                base_summary: "1 skill reference".to_string(),
                target_summary: "2 skill references".to_string(),
                planned_summary: "record skill copy plan in manifest".to_string(),
                risk: RiskLevel::Low,
            },
        ],
        conflicts: vec![ConflictItem {
            id: "conflict-local-rule-overlap".to_string(),
            path: target_path.to_string(),
            summary: "local target rule overlaps with profile rule scope".to_string(),
            resolution: "review before real write; dry-run keeps both entries".to_string(),
            risk: RiskLevel::Medium,
        }],
        drift: DriftReport {
            detected: true,
            count: 2,
            summary: "target differs from last known manifest in rules and skills".to_string(),
        },
        rollback_preview: RollbackPreview {
            backup_required: true,
            manifest_required: true,
            rollback_available_after_real_write: true,
            summary: "real write would create backup snapshot and rollback metadata before applying changes".to_string(),
        },
    }
}
