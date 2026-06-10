use crate::db::Database;
use crate::domain::audit::NewAuditEvent;
use crate::domain::errors::CommandError;
use crate::domain::refresh::NewRefreshRecord;
use crate::domain::signal::NewSignalCard;
use crate::domain::source_config::SourceConfig;

struct DefaultSource {
    id: &'static str,
    name: &'static str,
    source_type: &'static str,
    source_tier: &'static str,
    url: Option<&'static str>,
}

const DEFAULT_SOURCES: &[DefaultSource] = &[
    DefaultSource { id: "github-trending", name: "GitHub Trending", source_type: "community", source_tier: "community", url: Some("https://github.com/trending") },
    DefaultSource { id: "hackernews", name: "Hacker News", source_type: "community", source_tier: "community", url: Some("https://news.ycombinator.com") },
    DefaultSource { id: "reddit-ai-coding", name: "Reddit AI Coding", source_type: "community", source_tier: "community", url: Some("https://reddit.com/r/aicoding") },
    DefaultSource { id: "linux-do", name: "linux.do", source_type: "community", source_tier: "community", url: Some("https://linux.do") },
    DefaultSource { id: "codex-changelog", name: "Codex Changelog", source_type: "changelog", source_tier: "official", url: None },
    DefaultSource { id: "claude-code-changelog", name: "Claude Code Changelog", source_type: "changelog", source_tier: "official", url: None },
    DefaultSource { id: "model-news", name: "Model News", source_type: "model_news", source_tier: "official", url: None },
];

pub fn seed_default_sources(db: &Database) -> Result<(), CommandError> {
    for src in DEFAULT_SOURCES {
        db.upsert_source_config(src.id, src.name, src.source_type, src.source_tier, src.url)?;
    }
    Ok(())
}

pub fn refresh_source(db: &Database, source_id: &str) -> Result<Vec<String>, CommandError> {
    let auths = db.get_all_authorizations()?;
    let ext_auth = auths.iter().find(|a| a.scope == "external_signals");
    if ext_auth.map(|a| !a.granted).unwrap_or(true) {
        return Err(CommandError::authorization_required(
            "external_signals authorization required to refresh",
        ));
    }

    let source = db.get_source_config(source_id)?
        .ok_or_else(|| CommandError::validation(format!("source {source_id} not found")))?;

    if !source.enabled {
        return Err(CommandError::validation(format!("source {source_id} is disabled")));
    }

    let started_at = chrono::Utc::now().to_rfc3339();
    let signals = generate_fixture_signals(&source);
    let mut signal_ids = Vec::new();

    for s in &signals {
        let card = db.insert_signal(s)?;
        signal_ids.push(card.id);
    }

    let finished_at = chrono::Utc::now().to_rfc3339();
    let _ = db.insert_refresh(&NewRefreshRecord {
        source_name: source.name.clone(),
        source_url: source.url.clone(),
        triggered_by: "manual".into(),
        result_count: Some(signals.len() as i32),
        error_message: None,
        outcome: "success".into(),
        started_at: started_at.clone(),
        finished_at: Some(finished_at),
    });

    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "signal_refresh".into(),
        entity_type: Some("source".into()),
        entity_id: Some(source_id.into()),
        detail: Some(format!("{{\"count\":{}}}", signals.len())),
        outcome: "success".into(),
    });

    Ok(signal_ids)
}

pub fn refresh_all_enabled(db: &Database) -> Result<Vec<String>, CommandError> {
    let sources = db.list_source_configs()?;
    let mut all_ids = Vec::new();
    for source in sources {
        if source.enabled {
            match refresh_source(db, &source.id) {
                Ok(ids) => all_ids.extend(ids),
                Err(_) => continue,
            }
        }
    }
    Ok(all_ids)
}

fn generate_fixture_signals(source: &SourceConfig) -> Vec<NewSignalCard> {
    let now = chrono::Utc::now().to_rfc3339();
    match source.source_type.as_str() {
        "changelog" => vec![NewSignalCard {
            title: format!("{} 最近更新", source.name),
            source_url: source.url.clone(),
            source_tier: source.source_tier.clone(),
            signal_type: "changelog".into(),
            impact: "medium".into(),
            confidence: "confirmed".into(),
            excerpt: Some(format!("来自 {} 的产品更新信号（fixture）", source.name)),
            published_at: Some(now.clone()),
            fetched_at: now,
        }],
        "model_news" => vec![NewSignalCard {
            title: "模型能力更新信号".into(),
            source_url: None,
            source_tier: "official".into(),
            signal_type: "model_news".into(),
            impact: "medium".into(),
            confidence: "confirmed".into(),
            excerpt: Some("模型能力或可用性变化（fixture）".into()),
            published_at: Some(now.clone()),
            fetched_at: now,
        }],
        _ => vec![NewSignalCard {
            title: format!("{} 社区实践讨论", source.name),
            source_url: source.url.clone(),
            source_tier: "community".into(),
            signal_type: "community_discussion".into(),
            impact: "low".into(),
            confidence: "unverified".into(),
            excerpt: Some(format!("来自 {} 的社区讨论（fixture）", source.name)),
            published_at: Some(now.clone()),
            fetched_at: now,
        }],
    }
}
