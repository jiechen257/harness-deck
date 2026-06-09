use crate::domain::insights::{FeedItem, Insight, RealInsight, RealInsightCategory};
use crate::readers::claude_reader;

pub fn local_insights() -> Vec<Insight> {
    vec![
        Insight {
            id: "insight-token-anomaly".to_string(),
            title: "Token anomaly".to_string(),
            summary: "Estimated token burn is 24% above this profile's five-hour baseline."
                .to_string(),
            severity: "medium".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-repeated-failures".to_string(),
            title: "Repeated failures".to_string(),
            summary: "Two dry-run operations repeatedly require manual conflict review."
                .to_string(),
            severity: "medium".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-profile-drift".to_string(),
            title: "Profile drift".to_string(),
            summary: "Target state differs from the last manifest in rules and skills."
                .to_string(),
            severity: "high".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-update-impact".to_string(),
            title: "Update impact".to_string(),
            summary:
                "Registry update can improve sync guard wording without touching secrets."
                    .to_string(),
            severity: "low".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
    ]
}

pub fn local_feed() -> Vec<FeedItem> {
    vec![
        FeedItem {
            id: "feed-profile-impact".to_string(),
            title: "Harness Profile impact alert".to_string(),
            summary: "A curated guardrail update affects the active macOS Dev profile."
                .to_string(),
            priority: "High".to_string(),
            source: "registry-cache".to_string(),
            profile_impact: true,
        },
        FeedItem {
            id: "feed-community-template".to_string(),
            title: "Community template update".to_string(),
            summary: "A privacy review template was refreshed in the local cache.".to_string(),
            priority: "Normal".to_string(),
            source: "community-cache".to_string(),
            profile_impact: false,
        },
    ]
}

pub fn high_priority_feed() -> Vec<FeedItem> {
    local_feed()
        .into_iter()
        .filter(|item| item.priority == "High")
        .collect()
}

/// Generate real insights by analyzing Claude Code stats.
/// Falls back to empty list if stats are unavailable.
pub fn real_insights() -> Vec<RealInsight> {
    let mut insights = Vec::new();

    if let Some(stats) = claude_reader::read_claude_stats() {
        // Token anomaly detection: find days with messages > 2x average
        detect_token_anomalies(&stats, &mut insights);

        // Session activity insight
        detect_session_activity(&stats, &mut insights);

        // Model concentration insight
        detect_model_concentration(&stats, &mut insights);
    }

    insights
}

fn detect_token_anomalies(
    stats: &claude_reader::ClaudeStats,
    insights: &mut Vec<RealInsight>,
) {
    if stats.daily_activity.len() < 3 {
        return;
    }

    let messages: Vec<f64> = stats
        .daily_activity
        .iter()
        .map(|d| d.messages as f64)
        .collect();
    let mean = messages.iter().sum::<f64>() / messages.len() as f64;
    let variance = messages.iter().map(|m| (m - mean).powi(2)).sum::<f64>() / messages.len() as f64;
    let std_dev = variance.sqrt();

    if std_dev < 1.0 {
        return;
    }

    let threshold = mean + 2.0 * std_dev;
    let anomaly_days: Vec<&claude_reader::DailyActivity> = stats
        .daily_activity
        .iter()
        .filter(|d| d.messages as f64 > threshold)
        .collect();

    if !anomaly_days.is_empty() {
        let dates: Vec<&str> = anomaly_days.iter().map(|d| d.date.as_str()).collect();
        let max_messages = anomaly_days.iter().map(|d| d.messages).max().unwrap_or(0);
        insights.push(RealInsight {
            id: "real-token-anomaly".to_string(),
            category: RealInsightCategory::TokenAnomaly,
            title: "Token usage anomaly detected".to_string(),
            summary: format!(
                "{} day(s) with message count >2 std dev above mean ({:.0}). Peak: {} messages.",
                anomaly_days.len(),
                mean,
                max_messages
            ),
            severity: if anomaly_days.len() > 3 {
                "high".to_string()
            } else {
                "medium".to_string()
            },
            evidence: format!(
                "Anomaly dates: {}. Mean: {:.0}, StdDev: {:.0}, Threshold: {:.0}",
                dates.join(", "),
                mean,
                std_dev,
                threshold
            ),
            source: "stats-cache.json".to_string(),
        });
    }
}

fn detect_session_activity(
    stats: &claude_reader::ClaudeStats,
    insights: &mut Vec<RealInsight>,
) {
    if stats.total_sessions == 0 {
        return;
    }

    let avg_messages_per_session = if stats.total_sessions > 0 {
        stats.total_messages as f64 / stats.total_sessions as f64
    } else {
        0.0
    };

    let severity = if avg_messages_per_session > 200.0 {
        "high"
    } else if avg_messages_per_session > 100.0 {
        "medium"
    } else {
        "low"
    };

    insights.push(RealInsight {
        id: "real-session-activity".to_string(),
        category: RealInsightCategory::SessionActivity,
        title: "Session activity summary".to_string(),
        summary: format!(
            "{} total sessions, {} messages. Average {:.0} messages/session.",
            stats.total_sessions, stats.total_messages, avg_messages_per_session
        ),
        severity: severity.to_string(),
        evidence: format!(
            "Total sessions: {}, Total messages: {}, Longest session: {:.0} min",
            stats.total_sessions,
            stats.total_messages,
            stats.longest_session_minutes.unwrap_or(0.0)
        ),
        source: "stats-cache.json".to_string(),
    });
}

fn detect_model_concentration(
    stats: &claude_reader::ClaudeStats,
    insights: &mut Vec<RealInsight>,
) {
    if stats.model_usage.len() < 2 {
        return;
    }

    let total_output: u64 = stats.model_usage.iter().map(|m| m.output_tokens).sum();
    if total_output == 0 {
        return;
    }

    if let Some(top_model) = stats
        .model_usage
        .iter()
        .max_by_key(|m| m.output_tokens)
    {
        let concentration = top_model.output_tokens as f64 / total_output as f64;
        if concentration > 0.8 {
            insights.push(RealInsight {
                id: "real-model-concentration".to_string(),
                category: RealInsightCategory::ModelConcentration,
                title: "Model concentration".to_string(),
                summary: format!(
                    "{:.0}% of output tokens are from {}. Consider whether this aligns with your cost/quality goals.",
                    concentration * 100.0,
                    top_model.model
                ),
                severity: "low".to_string(),
                evidence: format!(
                    "Top model: {} ({} output tokens out of {} total)",
                    top_model.model, top_model.output_tokens, total_output
                ),
                source: "stats-cache.json".to_string(),
            });
        }
    }
}
