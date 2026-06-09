use crate::domain::usage::{
    CodexThreadItem, DailyActivityEntry, DataConfidence, DataSourceInfo, ModelUsageItem,
    RealUsageSummary, UsageMetric, UsageSummary,
};
use crate::readers::claude_reader;
use crate::readers::codex_reader;
use crate::readers::sanitizer;

pub fn confidence_label(confidence: DataConfidence) -> &'static str {
    match confidence {
        DataConfidence::Official => "Official",
        DataConfidence::LocalLog => "LocalLog",
        DataConfidence::Estimated => "Estimated",
        DataConfidence::Missing => "Missing",
    }
}

pub fn local_usage_summary() -> UsageSummary {
    UsageSummary {
        window_hours: 5,
        total_tokens: 182_400,
        cost_usd: 4.82,
        duration_minutes: 146,
        drift_events: 2,
        burn_rate_usd_per_hour: 0.96,
        metrics: vec![
            metric("tokens", "tokens", "182.4k", "", DataConfidence::LocalLog),
            metric("cost", "cost", "$4.82", "USD", DataConfidence::Estimated),
            metric("duration", "duration", "146", "min", DataConfidence::LocalLog),
            metric("drift", "drift", "2", "events", DataConfidence::Estimated),
            metric(
                "official-bill",
                "official billing",
                "not connected",
                "",
                DataConfidence::Missing,
            ),
            metric(
                "burn-rate",
                "burn rate",
                "$0.96",
                "USD/h",
                DataConfidence::Estimated,
            ),
        ],
    }
}

/// Build a real usage summary from local Claude Code stats and Codex thread data.
/// Falls back to fixture data on any failure.
pub fn real_usage_summary() -> RealUsageSummary {
    let home = sanitizer::home_dir();

    // Read Claude stats
    let claude_stats = claude_reader::read_claude_stats();
    let claude_available = claude_stats.is_some();

    // Read Codex thread stats
    let codex_stats = codex_reader::read_codex_thread_stats();
    let codex_available = codex_stats.is_some();

    let total_sessions = claude_stats
        .as_ref()
        .map(|s| s.total_sessions)
        .unwrap_or(0);
    let total_messages = claude_stats
        .as_ref()
        .map(|s| s.total_messages)
        .unwrap_or(0);

    let daily_activity: Vec<DailyActivityEntry> = claude_stats
        .as_ref()
        .map(|s| {
            s.daily_activity
                .iter()
                .map(|d| DailyActivityEntry {
                    date: d.date.clone(),
                    sessions: d.sessions,
                    messages: d.messages,
                    tool_calls: d.tool_calls,
                })
                .collect()
        })
        .unwrap_or_default();

    let model_usage: Vec<ModelUsageItem> = claude_stats
        .as_ref()
        .map(|s| {
            s.model_usage
                .iter()
                .map(|m| ModelUsageItem {
                    model: m.model.clone(),
                    input_tokens: m.input_tokens,
                    output_tokens: m.output_tokens,
                    cache_read_tokens: m.cache_read_tokens,
                    cost_usd: m.cost_usd,
                })
                .collect()
        })
        .unwrap_or_default();

    // Compute total tokens across all models
    let total_tokens: u64 = model_usage
        .iter()
        .map(|m| m.input_tokens + m.output_tokens)
        .sum();

    let total_cost_usd: f64 = model_usage.iter().map(|m| m.cost_usd).sum();

    // Compute window hours from daily activity date range
    let window_hours = compute_window_hours(&daily_activity);

    let burn_rate_per_hour = if window_hours > 0.0 {
        total_cost_usd / window_hours
    } else {
        0.0
    };

    let longest_session_minutes = claude_stats
        .as_ref()
        .and_then(|s| s.longest_session_minutes);

    let codex_thread_count = codex_stats
        .as_ref()
        .map(|s| s.total_threads)
        .unwrap_or(0);

    let codex_recent_threads: Vec<CodexThreadItem> = codex_stats
        .as_ref()
        .map(|s| {
            s.recent_threads
                .iter()
                .map(|t| CodexThreadItem {
                    id: t.id.clone(),
                    title: t.title.clone(),
                    created_at: t.created_at.clone(),
                    model: t.model.clone(),
                    tokens_used: t.tokens_used,
                    cwd: t.cwd.clone(),
                })
                .collect()
        })
        .unwrap_or_default();

    let data_sources = vec![
        DataSourceInfo {
            name: "Claude Code stats".to_string(),
            path: sanitizer::shorten_path(
                &home
                    .join(".claude")
                    .join("stats-cache.json")
                    .to_string_lossy(),
            ),
            available: claude_available,
        },
        DataSourceInfo {
            name: "Codex threads".to_string(),
            path: sanitizer::shorten_path(
                &home
                    .join(".codex")
                    .join("state_5.sqlite")
                    .to_string_lossy(),
            ),
            available: codex_available,
        },
    ];

    RealUsageSummary {
        total_sessions,
        total_messages,
        total_cost_usd,
        total_tokens,
        window_hours,
        burn_rate_per_hour,
        drift_events: 0,
        daily_activity,
        model_usage,
        codex_thread_count,
        codex_recent_threads,
        data_sources,
        longest_session_minutes,
    }
}

/// Compute the span of daily activity in hours.
/// Uses the date range of the daily activity entries.
fn compute_window_hours(daily_activity: &[DailyActivityEntry]) -> f64 {
    if daily_activity.is_empty() {
        return 0.0;
    }
    let dates: Vec<&str> = daily_activity.iter().map(|d| d.date.as_str()).collect();
    let first = dates.iter().min().unwrap_or(&"");
    let last = dates.iter().max().unwrap_or(&"");

    if first == last || first.is_empty() {
        // Single day, approximate from session count
        return daily_activity
            .iter()
            .map(|d| d.sessions as f64 * 0.5)
            .sum::<f64>()
            .max(1.0);
    }

    // Parse dates and compute day span
    if let (Ok(first_date), Ok(last_date)) = (
        chrono::NaiveDate::parse_from_str(first, "%Y-%m-%d"),
        chrono::NaiveDate::parse_from_str(last, "%Y-%m-%d"),
    ) {
        let days = (last_date - first_date).num_days().max(1) as f64;
        // Approximate active hours: total sessions * 0.5h average
        let session_hours: f64 = daily_activity
            .iter()
            .map(|d| d.sessions as f64 * 0.5)
            .sum();
        // Return max of day-based estimate and session-based estimate
        session_hours.max(days * 2.0)
    } else {
        daily_activity.len() as f64 * 2.0
    }
}

fn metric(
    id: &str,
    label: &str,
    value: &str,
    unit: &str,
    confidence: DataConfidence,
) -> UsageMetric {
    UsageMetric {
        id: id.to_string(),
        label: label.to_string(),
        value: value.to_string(),
        unit: unit.to_string(),
        confidence,
        confidence_label: confidence_label(confidence).to_string(),
    }
}
