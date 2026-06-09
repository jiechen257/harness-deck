use std::collections::HashMap;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use super::sanitizer;

/// Summary of Claude Code configuration read from `~/.claude/` and `~/.claude.json`.
#[derive(Debug, Clone, Default)]
pub struct ClaudeConfigSnapshot {
    pub editor_mode: Option<String>,
    pub theme: Option<String>,
    pub permission_allow_count: usize,
    pub permission_deny_count: usize,
    pub hook_count: usize,
    pub env_vars: HashMap<String, String>,
    pub mcp_server_names: Vec<String>,
    pub num_startups: Option<u64>,
    pub skill_count: usize,
    pub project_count: usize,
    pub plugin_names: Vec<String>,
}

/// Read Claude Code configuration from the local machine.
/// Returns `None` if `~/.claude/` does not exist.
pub fn read_claude_config() -> Option<ClaudeConfigSnapshot> {
    let home = sanitizer::home_dir();
    let claude_dir = home.join(".claude");
    if !claude_dir.exists() {
        return None;
    }

    let mut snapshot = ClaudeConfigSnapshot::default();

    // ~/.claude/settings.json
    read_settings_json(&claude_dir.join("settings.json"), &mut snapshot);

    // ~/.claude.json (top-level, not inside .claude/)
    read_dot_claude_json(&home.join(".claude.json"), &mut snapshot);

    // Count skill dirs
    snapshot.skill_count = count_dirs(&claude_dir.join("skills"));

    // Count project dirs
    snapshot.project_count = count_dirs(&claude_dir.join("projects"));

    // Read installed plugins
    snapshot.plugin_names = read_plugin_names(&claude_dir.join("plugins").join("installed_plugins.json"));

    Some(snapshot)
}

fn read_settings_json(path: &PathBuf, snapshot: &mut ClaudeConfigSnapshot) {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let val: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return,
    };

    snapshot.editor_mode = val.get("editorMode").and_then(|v| v.as_str()).map(String::from);
    snapshot.theme = val.get("theme").and_then(|v| v.as_str()).map(String::from);

    // Permissions
    if let Some(permissions) = val.get("permissions") {
        if let Some(allow) = permissions.get("allow").and_then(|v| v.as_array()) {
            snapshot.permission_allow_count = allow.len();
        }
        if let Some(deny) = permissions.get("deny").and_then(|v| v.as_array()) {
            snapshot.permission_deny_count = deny.len();
        }
    }

    // Hooks
    if let Some(hooks) = val.get("hooks").and_then(|v| v.as_object()) {
        snapshot.hook_count = hooks.len();
    }

    // Env vars (redacted)
    if let Some(env) = val.get("env").and_then(|v| v.as_object()) {
        for (key, value) in env {
            if let Some(v_str) = value.as_str() {
                let redacted = sanitizer::redact_env_value(key, v_str);
                snapshot.env_vars.insert(key.clone(), redacted);
            }
        }
    }
}

fn read_dot_claude_json(path: &PathBuf, snapshot: &mut ClaudeConfigSnapshot) {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let val: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return,
    };

    // MCP server names
    if let Some(mcp) = val.get("mcpServers").and_then(|v| v.as_object()) {
        snapshot.mcp_server_names = mcp.keys().cloned().collect();
    }

    // numStartups
    snapshot.num_startups = val.get("numStartups").and_then(|v| v.as_u64());
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

fn read_plugin_names(path: &PathBuf) -> Vec<String> {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };
    let val: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };
    match val.as_array() {
        Some(arr) => arr
            .iter()
            .filter_map(|item| {
                item.get("name")
                    .and_then(|n| n.as_str())
                    .map(String::from)
            })
            .collect(),
        None => Vec::new(),
    }
}

// ---- Usage stats reading ----

/// A single day of Claude Code activity from `stats-cache.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date: String,
    pub sessions: u32,
    pub messages: u32,
    pub tool_calls: u32,
}

/// Per-model token usage from `stats-cache.json` `modelUsage` map.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelUsageEntry {
    pub model: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cost_usd: f64,
}

/// Aggregated stats extracted from `~/.claude/stats-cache.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeStats {
    pub total_sessions: u32,
    pub total_messages: u32,
    pub daily_activity: Vec<DailyActivity>,
    pub model_usage: Vec<ModelUsageEntry>,
    pub longest_session_minutes: Option<f64>,
}

/// Read usage statistics from `~/.claude/stats-cache.json`.
/// Returns `None` if the file does not exist or cannot be parsed.
pub fn read_claude_stats() -> Option<ClaudeStats> {
    let home = sanitizer::home_dir();
    let path = home.join(".claude").join("stats-cache.json");
    let content = std::fs::read_to_string(&path).ok()?;
    let val: serde_json::Value = serde_json::from_str(&content).ok()?;

    let total_sessions = val
        .get("totalSessions")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;
    let total_messages = val
        .get("totalMessages")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;

    // longestSession is an object with "duration" in milliseconds
    let longest_session_minutes = val
        .get("longestSession")
        .and_then(|v| v.get("duration"))
        .and_then(|v| v.as_f64())
        .map(|ms| ms / 60_000.0);

    // dailyActivity: array of { date, messageCount, sessionCount, toolCallCount }
    let daily_activity = val
        .get("dailyActivity")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let date = item.get("date")?.as_str()?.to_string();
                    let sessions = item
                        .get("sessionCount")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32;
                    let messages = item
                        .get("messageCount")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32;
                    let tool_calls = item
                        .get("toolCallCount")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32;
                    Some(DailyActivity {
                        date,
                        sessions,
                        messages,
                        tool_calls,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    // modelUsage: object keyed by model name
    let model_usage = val
        .get("modelUsage")
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .map(|(model_name, model_val)| {
                    let input_tokens = model_val
                        .get("inputTokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let output_tokens = model_val
                        .get("outputTokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let cache_read_tokens = model_val
                        .get("cacheReadInputTokens")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let cost_usd = model_val
                        .get("costUSD")
                        .and_then(|v| v.as_f64())
                        .unwrap_or(0.0);
                    ModelUsageEntry {
                        model: model_name.clone(),
                        input_tokens,
                        output_tokens,
                        cache_read_tokens,
                        cost_usd,
                    }
                })
                .collect()
        })
        .unwrap_or_default();

    Some(ClaudeStats {
        total_sessions,
        total_messages,
        daily_activity,
        model_usage,
        longest_session_minutes,
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
    fn read_plugin_names_handles_missing_file() {
        let names = read_plugin_names(&PathBuf::from("/nonexistent/file.json"));
        assert!(names.is_empty());
    }

    #[test]
    fn read_claude_stats_returns_some_when_file_exists() {
        // This test depends on the actual file existing; it's ok to skip in CI
        let stats = read_claude_stats();
        if stats.is_some() {
            let s = stats.unwrap();
            assert!(s.total_sessions > 0 || s.total_messages > 0);
        }
    }
}
