use crate::domain::insights::{FeedItem, Insight};

pub fn local_insights() -> Vec<Insight> {
    vec![
        Insight {
            id: "insight-token-anomaly".to_string(),
            title: "Token anomaly".to_string(),
            summary: "Estimated token burn is 24% above this profile's five-hour baseline.".to_string(),
            severity: "medium".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-repeated-failures".to_string(),
            title: "Repeated failures".to_string(),
            summary: "Two dry-run operations repeatedly require manual conflict review.".to_string(),
            severity: "medium".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-profile-drift".to_string(),
            title: "Profile drift".to_string(),
            summary: "Target state differs from the last manifest in rules and skills.".to_string(),
            severity: "high".to_string(),
            related_profile_id: "macos-dev".to_string(),
            source: "local-rule".to_string(),
        },
        Insight {
            id: "insight-update-impact".to_string(),
            title: "Update impact".to_string(),
            summary: "Registry update can improve sync guard wording without touching secrets.".to_string(),
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
            summary: "A curated guardrail update affects the active macOS Dev profile.".to_string(),
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
