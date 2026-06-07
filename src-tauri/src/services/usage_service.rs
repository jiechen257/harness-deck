use crate::domain::usage::{DataConfidence, UsageMetric, UsageSummary};

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
            metric("official-bill", "official billing", "not connected", "", DataConfidence::Missing),
            metric("burn-rate", "burn rate", "$0.96", "USD/h", DataConfidence::Estimated),
        ],
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
