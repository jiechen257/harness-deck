use std::path::PathBuf;

use crate::domain::adapter::TargetKind;
use crate::domain::errors::CommandError;
use crate::domain::target_integration::TargetDiscoverySummary;

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

    Ok(vec![
        safe_summary(TargetKind::Codex, "Codex local target", codex_path),
        safe_summary(TargetKind::ClaudeCode, "Claude Code local target", claude_path),
    ])
}

fn safe_summary(kind: TargetKind, name: &str, root: PathBuf) -> TargetDiscoverySummary {
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
    }
}
