use std::time::Duration;

use reqwest::Client;

use crate::domain::byoa::{AgentInvocation, AgentKind};
use crate::domain::crawl::{CrawlItem, CrawlResult, CrawlSource, CrawlSummary, ItemType};
use crate::domain::errors::CommandError;
use crate::services::byoa_service;

const DEFAULT_KEYWORDS: &[&str] = &[
    "claude",
    "codex",
    "cursor",
    "AI coding",
    "harness",
    "agent",
    "CLAUDE.md",
    "AGENTS.md",
    "skill",
    "hook",
    "MCP",
    "prompt engineering",
    "coding assistant",
    "copilot",
    "windsurf",
    "cline",
    "aider",
];

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

async fn crawl_github(client: &Client, keywords: &[String]) -> CrawlResult {
    let query = keywords.join("+");
    let url = format!(
        "https://api.github.com/search/repositories?q={query}+pushed:>2025-01-01&sort=stars&order=desc&per_page=30"
    );

    let result = tokio::time::timeout(Duration::from_secs(10), async {
        client
            .get(&url)
            .header("User-Agent", "Hone/0.1")
            .send()
            .await
    })
    .await;

    let response = match result {
        Ok(Ok(resp)) => resp,
        Ok(Err(e)) => {
            return CrawlResult {
                source: CrawlSource::GitHub,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: keywords.to_vec(),
                error: Some(format!("GitHub request failed: {e}")),
            };
        }
        Err(_) => {
            return CrawlResult {
                source: CrawlSource::GitHub,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: keywords.to_vec(),
                error: Some("GitHub request timed out after 10s".to_string()),
            };
        }
    };

    let json: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(e) => {
            return CrawlResult {
                source: CrawlSource::GitHub,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: keywords.to_vec(),
                error: Some(format!("GitHub JSON parse failed: {e}")),
            };
        }
    };

    let items = json["items"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|repo| CrawlItem {
            id: format!("gh-{}", repo["full_name"].as_str().unwrap_or("unknown")),
            title: repo["full_name"]
                .as_str()
                .unwrap_or("unknown")
                .to_string(),
            url: repo["html_url"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            source: CrawlSource::GitHub,
            item_type: ItemType::Repository,
            score: repo["stargazers_count"].as_u64().map(|s| s as u32),
            summary: repo["description"].as_str().map(|s| s.to_string()),
            author: repo["owner"]["login"].as_str().map(|s| s.to_string()),
            created_at: repo["updated_at"].as_str().map(|s| s.to_string()),
            relevance: None,
        })
        .collect();

    CrawlResult {
        source: CrawlSource::GitHub,
        items,
        crawled_at: now_iso(),
        filter_keywords: keywords.to_vec(),
        error: None,
    }
}

async fn crawl_hackernews(client: &Client, _keywords: &[String]) -> CrawlResult {
    let top_result = tokio::time::timeout(Duration::from_secs(10), async {
        client
            .get("https://hacker-news.firebaseio.com/v0/topstories.json")
            .send()
            .await
    })
    .await;

    let ids: Vec<u64> = match top_result {
        Ok(Ok(resp)) => match resp.json::<Vec<u64>>().await {
            Ok(ids) => ids.into_iter().take(100).collect(),
            Err(e) => {
                return CrawlResult {
                    source: CrawlSource::HackerNews,
                    items: vec![],
                    crawled_at: now_iso(),
                    filter_keywords: vec![],
                    error: Some(format!("HN top stories parse failed: {e}")),
                };
            }
        },
        Ok(Err(e)) => {
            return CrawlResult {
                source: CrawlSource::HackerNews,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some(format!("HN request failed: {e}")),
            };
        }
        Err(_) => {
            return CrawlResult {
                source: CrawlSource::HackerNews,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some("HN request timed out after 10s".to_string()),
            };
        }
    };

    let mut items = Vec::new();
    for id in ids {
        let url = format!("https://hacker-news.firebaseio.com/v0/item/{id}.json");
        let item_resp = client.get(&url).send().await;
        let json: serde_json::Value = match item_resp {
            Ok(resp) => match resp.json().await {
                Ok(v) => v,
                Err(_) => continue,
            },
            Err(_) => continue,
        };

        let item_type = json["type"].as_str().unwrap_or("");
        if item_type != "story" {
            continue;
        }

        let title = json["title"].as_str().unwrap_or("").to_string();
        let item_url = json["url"]
            .as_str()
            .unwrap_or("")
            .to_string();
        let hn_url = if item_url.is_empty() {
            format!("https://news.ycombinator.com/item?id={id}")
        } else {
            item_url
        };

        items.push(CrawlItem {
            id: format!("hn-{id}"),
            title,
            url: hn_url,
            source: CrawlSource::HackerNews,
            item_type: ItemType::Discussion,
            score: json["score"].as_u64().map(|s| s as u32),
            summary: None,
            author: json["by"].as_str().map(|s| s.to_string()),
            created_at: json["time"]
                .as_u64()
                .map(|t| chrono::DateTime::from_timestamp(t as i64, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()),
            relevance: None,
        });
    }

    CrawlResult {
        source: CrawlSource::HackerNews,
        items,
        crawled_at: now_iso(),
        filter_keywords: vec![],
        error: None,
    }
}

async fn crawl_reddit(client: &Client, _keywords: &[String]) -> CrawlResult {
    let result = tokio::time::timeout(Duration::from_secs(10), async {
        client
            .get("https://www.reddit.com/r/ClaudeAI+ChatGPTCoding+LocalLLaMA/hot.json?limit=50")
            .header("User-Agent", "Hone/0.1 (desktop app)")
            .send()
            .await
    })
    .await;

    let response = match result {
        Ok(Ok(resp)) => resp,
        Ok(Err(e)) => {
            return CrawlResult {
                source: CrawlSource::Reddit,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some(format!("Reddit request failed: {e}")),
            };
        }
        Err(_) => {
            return CrawlResult {
                source: CrawlSource::Reddit,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some("Reddit request timed out after 10s".to_string()),
            };
        }
    };

    let json: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(e) => {
            return CrawlResult {
                source: CrawlSource::Reddit,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some(format!("Reddit JSON parse failed: {e}")),
            };
        }
    };

    let children = json["data"]["children"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let items = children
        .iter()
        .map(|child| {
            let data = &child["data"];
            let permalink = data["permalink"].as_str().unwrap_or("").to_string();
            let post_url = data["url"].as_str().unwrap_or("").to_string();
            let url = if post_url == permalink || post_url.is_empty() {
                format!("https://www.reddit.com{permalink}")
            } else {
                post_url
            };

            CrawlItem {
                id: format!(
                    "reddit-{}",
                    data["id"].as_str().unwrap_or("unknown")
                ),
                title: data["title"].as_str().unwrap_or("").to_string(),
                url,
                source: CrawlSource::Reddit,
                item_type: ItemType::Discussion,
                score: data["score"].as_u64().map(|s| s as u32),
                summary: None,
                author: data["author"].as_str().map(|s| s.to_string()),
                created_at: data["created_utc"]
                    .as_f64()
                    .map(|t| chrono::DateTime::from_timestamp(t as i64, 0)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()),
                relevance: None,
            }
        })
        .collect();

    CrawlResult {
        source: CrawlSource::Reddit,
        items,
        crawled_at: now_iso(),
        filter_keywords: vec![],
        error: None,
    }
}

async fn crawl_linuxdo(client: &Client, _keywords: &[String]) -> CrawlResult {
    let result = tokio::time::timeout(Duration::from_secs(10), async {
        client
            .get("https://linux.do/latest.json")
            .send()
            .await
    })
    .await;

    let response = match result {
        Ok(Ok(resp)) => resp,
        Ok(Err(e)) => {
            return CrawlResult {
                source: CrawlSource::LinuxDo,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some(format!("LinuxDo request failed: {e}")),
            };
        }
        Err(_) => {
            return CrawlResult {
                source: CrawlSource::LinuxDo,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some("LinuxDo request timed out after 10s".to_string()),
            };
        }
    };

    let json: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(e) => {
            return CrawlResult {
                source: CrawlSource::LinuxDo,
                items: vec![],
                crawled_at: now_iso(),
                filter_keywords: vec![],
                error: Some(format!("LinuxDo JSON parse failed: {e}")),
            };
        }
    };

    let topics = json["topic_list"]["topics"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let items = topics
        .iter()
        .map(|topic| {
            let id = topic["id"].as_u64().unwrap_or(0);
            let slug = topic["slug"].as_str().unwrap_or("topic");
            CrawlItem {
                id: format!("linuxdo-{id}"),
                title: topic["title"].as_str().unwrap_or("").to_string(),
                url: format!("https://linux.do/t/{slug}/{id}"),
                source: CrawlSource::LinuxDo,
                item_type: ItemType::Discussion,
                score: topic["like_count"].as_u64().map(|s| s as u32),
                summary: None,
                author: None,
                created_at: topic["created_at"].as_str().map(|s| s.to_string()),
                relevance: None,
            }
        })
        .collect();

    CrawlResult {
        source: CrawlSource::LinuxDo,
        items,
        crawled_at: now_iso(),
        filter_keywords: vec![],
        error: None,
    }
}

fn keyword_filter(items: &[CrawlItem], keywords: &[String]) -> Vec<CrawlItem> {
    let lower_keywords: Vec<String> = keywords.iter().map(|k| k.to_lowercase()).collect();
    items
        .iter()
        .filter(|item| {
            let title_lower = item.title.to_lowercase();
            let summary_lower = item
                .summary
                .as_deref()
                .unwrap_or("")
                .to_lowercase();
            lower_keywords
                .iter()
                .any(|kw| title_lower.contains(kw) || summary_lower.contains(kw))
        })
        .cloned()
        .collect()
}

pub fn load_curated_registry() -> CrawlResult {
    let items = vec![
        CrawlItem {
            id: "curated-superpowers".to_string(),
            title: "obra/superpowers".to_string(),
            url: "https://github.com/obra/superpowers".to_string(),
            source: CrawlSource::Curated,
            item_type: ItemType::Repository,
            score: Some(1000),
            summary: Some(
                "An agentic skills framework & software development methodology that works."
                    .to_string(),
            ),
            author: Some("obra".to_string()),
            created_at: None,
            relevance: None,
        },
        CrawlItem {
            id: "curated-waza".to_string(),
            title: "tw93/Waza".to_string(),
            url: "https://github.com/tw93/Waza".to_string(),
            source: CrawlSource::Curated,
            item_type: ItemType::Repository,
            score: Some(500),
            summary: Some(
                "Engineering habits you already know, turned into skills Claude can run."
                    .to_string(),
            ),
            author: Some("tw93".to_string()),
            created_at: None,
            relevance: None,
        },
        CrawlItem {
            id: "curated-openspec".to_string(),
            title: "Fission-AI/OpenSpec".to_string(),
            url: "https://github.com/Fission-AI/OpenSpec".to_string(),
            source: CrawlSource::Curated,
            item_type: ItemType::Repository,
            score: Some(300),
            summary: Some(
                "Spec-driven development (SDD) for AI coding assistants.".to_string(),
            ),
            author: Some("Fission-AI".to_string()),
            created_at: None,
            relevance: None,
        },
    ];

    CrawlResult {
        source: CrawlSource::Curated,
        items,
        crawled_at: now_iso(),
        filter_keywords: vec![],
        error: None,
    }
}

pub async fn crawl_all(
    custom_keywords: Option<Vec<String>>,
) -> Result<CrawlSummary, CommandError> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| CommandError::subprocess(format!("Failed to build HTTP client: {e}")))?;

    let keywords: Vec<String> = custom_keywords.unwrap_or_else(|| {
        DEFAULT_KEYWORDS.iter().map(|s| s.to_string()).collect()
    });

    let (github, hackernews, reddit, linuxdo) = tokio::join!(
        crawl_github(&client, &keywords),
        crawl_hackernews(&client, &keywords),
        crawl_reddit(&client, &keywords),
        crawl_linuxdo(&client, &keywords),
    );

    let curated = load_curated_registry();

    // Count total raw items across all sources
    let total_raw = github.items.len()
        + hackernews.items.len()
        + reddit.items.len()
        + linuxdo.items.len()
        + curated.items.len();

    // Apply keyword filter to non-curated results
    let filtered_github_items = keyword_filter(&github.items, &keywords);
    let filtered_hn_items = keyword_filter(&hackernews.items, &keywords);
    let filtered_reddit_items = keyword_filter(&reddit.items, &keywords);
    let filtered_linuxdo_items = keyword_filter(&linuxdo.items, &keywords);

    let total_filtered = filtered_github_items.len()
        + filtered_hn_items.len()
        + filtered_reddit_items.len()
        + filtered_linuxdo_items.len()
        + curated.items.len();

    let results = vec![
        CrawlResult {
            items: filtered_github_items,
            ..github
        },
        CrawlResult {
            items: filtered_hn_items,
            ..hackernews
        },
        CrawlResult {
            items: filtered_reddit_items,
            ..reddit
        },
        CrawlResult {
            items: filtered_linuxdo_items,
            ..linuxdo
        },
        curated,
    ];

    Ok(CrawlSummary {
        results,
        total_raw,
        total_filtered,
        total_ranked: 0,
        agent_used: None,
    })
}

pub async fn rank_with_agent(
    items: Vec<CrawlItem>,
    agent_kind: AgentKind,
) -> Result<Vec<CrawlItem>, CommandError> {
    let n = items.len();

    let item_descriptions: Vec<String> = items
        .iter()
        .map(|item| {
            let summary_truncated = item
                .summary
                .as_deref()
                .unwrap_or("")
                .chars()
                .take(100)
                .collect::<String>();
            format!(
                "- id: \"{}\", title: \"{}\", summary: \"{}\"",
                item.id, item.title, summary_truncated
            )
        })
        .collect();

    let prompt = format!(
        "Below are {n} community content items about AI coding. Rate each by relevance to \
         'AI coding agent configuration best practices' on a 0-100 scale. Return a JSON array: \
         [{{\"id\": \"...\", \"score\": N}}]. Only return the JSON array, no other text.\n\n{}",
        item_descriptions.join("\n")
    );

    let invocation = AgentInvocation {
        kind: agent_kind,
        prompt,
        timeout_secs: 60,
        request_json_output: true,
    };

    let result = tokio::task::spawn_blocking(move || byoa_service::invoke_agent(invocation))
        .await
        .map_err(|e| CommandError::subprocess(e.to_string()))??;

    // Parse scores from agent output
    let scores: Vec<(String, f64)> = if let Some(json_val) = &result.parsed_json {
        if let Some(arr) = json_val.as_array() {
            arr.iter()
                .filter_map(|entry| {
                    let id = entry["id"].as_str()?.to_string();
                    let score = entry["score"].as_f64()?;
                    Some((id, score / 100.0))
                })
                .collect()
        } else {
            vec![]
        }
    } else {
        // Try parsing stdout directly
        serde_json::from_str::<Vec<serde_json::Value>>(&result.stdout)
            .ok()
            .map(|arr| {
                arr.iter()
                    .filter_map(|entry| {
                        let id = entry["id"].as_str()?.to_string();
                        let score = entry["score"].as_f64()?;
                        Some((id, score / 100.0))
                    })
                    .collect()
            })
            .unwrap_or_default()
    };

    let mut ranked_items: Vec<CrawlItem> = items
        .into_iter()
        .map(|mut item| {
            if let Some((_, score)) = scores.iter().find(|(id, _)| id == &item.id) {
                item.relevance = Some(*score);
            }
            item
        })
        .collect();

    ranked_items.sort_by(|a, b| {
        b.relevance
            .unwrap_or(0.0)
            .partial_cmp(&a.relevance.unwrap_or(0.0))
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(ranked_items)
}
