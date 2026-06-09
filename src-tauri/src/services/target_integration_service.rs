use std::path::PathBuf;

use crate::domain::adapter::TargetKind;
use crate::domain::errors::CommandError;
use crate::domain::target_integration::{TargetConfigSummary, TargetDiscoverySummary};
use crate::readers::claude_reader;
use crate::readers::codex_reader;

pub fn discover_real_targets(
    authorized_for_local_read: bool,
) -> Result<Vec<TargetDiscoverySummary>, CommandError> {
    if !authorized_for_local_read {
        return Err(CommandError::authorization_required(
            "local target discovery requires explicit read authorization",
        ));
    }

    let home = std::env::var("HOME").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("~"));
    let codex_path = home.join(".codex");
    let claude_path = home.join(".claude");

    let claude_snapshot = claude_reader::read_claude_config();
    let codex_snapshot = codex_reader::read_codex_config();

    let claude_summary = claude_snapshot.as_ref().map(|s| TargetConfigSummary {
        model: None,
        editor_mode: s.editor_mode.clone(),
        theme: s.theme.clone(),
        mcp_server_count: s.mcp_server_names.len(),
        skill_count: s.skill_count,
        hook_count: s.hook_count,
        permission_allow_count: s.permission_allow_count,
        permission_deny_count: s.permission_deny_count,
        plugin_count: s.plugin_names.len(),
        startup_count: s.num_startups.unwrap_or(0) as usize,
        project_count: s.project_count,
        version: None,
    });

    let codex_summary = codex_snapshot.as_ref().map(|s| TargetConfigSummary {
        model: s.model.clone(),
        editor_mode: None,
        theme: None,
        mcp_server_count: s.mcp_server_names.len(),
        skill_count: s.skill_count,
        hook_count: 0,
        permission_allow_count: 0,
        permission_deny_count: 0,
        plugin_count: s.plugin_names.len(),
        startup_count: s.session_count,
        project_count: s.trusted_project_count,
        version: s.version.clone(),
    });

    Ok(vec![
        safe_summary(TargetKind::Codex, "Codex local target", codex_path, codex_summary),
        safe_summary(TargetKind::ClaudeCode, "Claude Code local target", claude_path, claude_summary),
    ])
}

fn safe_summary(
    kind: TargetKind,
    name: &str,
    root: PathBuf,
    config_summary: Option<TargetConfigSummary>,
) -> TargetDiscoverySummary {
    let discovered = root.exists();
    let candidate_paths = match kind {
        TargetKind::Codex => vec![root.join("AGENTS.md"), root.join("config.toml")],
        TargetKind::ClaudeCode => vec![root.join("CLAUDE.md"), root.join("settings.json")],
    };

    TargetDiscoverySummary {
        kind,
        name: name.to_string(),
        discovered,
        candidate_paths: candidate_paths
            .into_iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect(),
        schema_status: if discovered {
            "summary-only validation available".to_string()
        } else {
            "target directory not found".to_string()
        },
        raw_config_preview: None,
        config_summary,
    }
}
