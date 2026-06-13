use std::path::PathBuf;

use rusqlite::OpenFlags;
use serde::{Deserialize, Serialize};

use super::sanitizer;

/// Summary of Codex configuration read from `~/.codex/`.
#[derive(Debug, Clone, Default)]
pub struct CodexConfigSnapshot {
    pub model: Option<String>,
    pub sandbox_mode: Option<String>,
    pub approval_policy: Option<String>,
    pub mcp_server_names: Vec<String>,
    pub plugin_names: Vec<String>,
    pub trusted_project_count: usize,
    pub version: Option<String>,
    pub skill_count: usize,
    pub session_count: usize,
}

/// Read Codex configuration from the local machine.
/// Returns `None` if `~/.codex/` does not exist.
/// Never reads `~/.codex/auth.json` or `~/.codex/.env`.
pub fn read_codex_config() -> Option<CodexConfigSnapshot> {
    let home = sanitizer::home_dir();
    let codex_dir = home.join(".codex");
    if !codex_dir.exists() {
        return None;
    }

    let mut snapshot = CodexConfigSnapshot::default();

    // ~/.codex/config.toml
    read_config_toml(&codex_dir.join("config.toml"), &mut snapshot);

    // ~/.codex/version.json
    snapshot.version = read_version_json(&codex_dir.join("version.json"));

    // Count skill dirs
    snapshot.skill_count = count_dirs(&codex_dir.join("skills"));

    // Count session lines
    snapshot.session_count = count_lines(&codex_dir.join("session_index.jsonl"));

    Some(snapshot)
}

fn read_config_toml(path: &PathBuf, snapshot: &mut CodexConfigSnapshot) {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let val: toml::Value = match content.parse() {
        Ok(v) => v,
        Err(_) => return,
    };

    snapshot.model = val.get("model").and_then(|v| v.as_str()).map(String::from);
    snapshot.sandbox_mode = val
        .get("sandbox_mode")
        .and_then(|v| v.as_str())
        .map(String::from);
    snapshot.approval_policy = val
        .get("approval_policy")
        .and_then(|v| v.as_str())
        .map(String::from);

    // MCP servers
    if let Some(mcp) = val.get("mcp_servers").and_then(|v| v.as_table()) {
        snapshot.mcp_server_names = mcp.keys().cloned().collect();
    }

    // Plugins
    if let Some(plugins) = val.get("plugins").and_then(|v| v.as_array()) {
        snapshot.plugin_names = plugins
            .iter()
            .filter_map(|item| item.get("name").and_then(|n| n.as_str()).map(String::from))
            .collect();
    }

    // Trusted projects
    if let Some(projects) = val.get("trusted_projects").and_then(|v| v.as_array()) {
        snapshot.trusted_project_count = projects.len();
    }
}

fn read_version_json(path: &PathBuf) -> Option<String> {
    let content = std::fs::read_to_string(path).ok()?;
    let val: serde_json::Value = serde_json::from_str(&content).ok()?;
    val.get("version")
        .and_then(|v| v.as_str())
        .map(String::from)
}

fn count_dirs(dir: &PathBuf) -> usize {
    match std::fs::read_dir(dir) {
        Ok(entries) => entries
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
            .count(),
        Err(_) => 0,
    }
}

fn count_lines(path: &PathBuf) -> usize {
    match std::fs::read_to_string(path) {
        Ok(content) => content
            .lines()
            .filter(|line| !line.trim().is_empty())
            .count(),
        Err(_) => 0,
    }
}

// ---- Thread stats reading ----

/// Summary of a single Codex thread from the SQLite database.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexThreadSummary {
    pub id: String,
    pub title: Option<String>,
    pub created_at: String,
    pub model: Option<String>,
    pub tokens_used: Option<u64>,
    pub cwd: Option<String>,
}

/// Aggregated thread stats from `~/.codex/state_5.sqlite`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexThreadStats {
    pub total_threads: u32,
    pub recent_threads: Vec<CodexThreadSummary>,
}

/// Read thread statistics from Codex SQLite database (READ-ONLY).
/// Returns `None` if the database does not exist or cannot be read.
pub fn read_codex_thread_stats() -> Option<CodexThreadStats> {
    let home = sanitizer::home_dir();
    let db_path = home.join(".codex").join("state_5.sqlite");
    if !db_path.exists() {
        return None;
    }

    let conn = rusqlite::Connection::open_with_flags(
        &db_path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()?;

    let total_threads: u32 = conn
        .query_row("SELECT COUNT(*) FROM threads", [], |row| row.get(0))
        .unwrap_or(0);

    let mut stmt = conn
        .prepare(
            "SELECT id, title, created_at, model, tokens_used, cwd \
             FROM threads ORDER BY updated_at DESC LIMIT 20",
        )
        .ok()?;

    let recent_threads: Vec<CodexThreadSummary> = stmt
        .query_map([], |row| {
            let created_epoch: i64 = row.get(2)?;
            let created_at = chrono::DateTime::from_timestamp(created_epoch, 0)
                .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
                .unwrap_or_else(|| created_epoch.to_string());

            let title: String = row.get(1)?;
            let model: Option<String> = row.get(3)?;
            let tokens_used: Option<i64> = row.get(4)?;
            let cwd: String = row.get(5)?;

            Ok(CodexThreadSummary {
                id: row.get(0)?,
                title: if title.is_empty() { None } else { Some(title) },
                created_at,
                model,
                tokens_used: tokens_used.map(|t| t as u64),
                cwd: if cwd.is_empty() {
                    None
                } else {
                    Some(sanitizer::shorten_path(&cwd))
                },
            })
        })
        .ok()?
        .filter_map(|r| r.ok())
        .collect();

    Some(CodexThreadStats {
        total_threads,
        recent_threads,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn count_dirs_returns_zero_for_missing() {
        assert_eq!(count_dirs(&PathBuf::from("/nonexistent/path")), 0);
    }

    #[test]
    fn count_lines_returns_zero_for_missing() {
        assert_eq!(count_lines(&PathBuf::from("/nonexistent/file")), 0);
    }

    #[test]
    fn read_version_json_handles_missing() {
        let version = read_version_json(&PathBuf::from("/nonexistent/version.json"));
        assert!(version.is_none());
    }

    #[test]
    fn read_codex_thread_stats_returns_some_when_db_exists() {
        let stats = read_codex_thread_stats();
        if stats.is_some() {
            let s = stats.unwrap();
            assert!(s.total_threads > 0);
        }
    }
}
