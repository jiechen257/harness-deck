use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

use crate::db::Database;
use crate::domain::audit::NewAuditEvent;
use crate::domain::byoa::AgentKind;
use crate::domain::errors::CommandError;
use crate::domain::local_asset::{LocalAsset, NewLocalAsset};
use crate::domain::loop_summary::{
    LoopDecision, LoopMetric, LoopSection, LoopSummary, TargetHealthSummary,
};
use crate::domain::practice::{NewPracticeCard, NormalizeResult, PracticeCard, PracticeDraft};
use crate::services::skill_service;

pub fn get_loop_summary(db: &Database) -> Result<LoopSummary, CommandError> {
    let signals = db.list_signals()?;
    let practices = db.list_practices()?;
    let assets = db.list_assets()?;
    let projections = db.list_projections()?;
    let audits = db.list_recent_audits(5)?;

    let inbox_signals = signals.iter().filter(|s| s.status == "inbox").count();
    let high_impact = signals.iter().filter(|s| s.impact == "high").count();
    let official_signals = signals
        .iter()
        .filter(|s| s.source_tier == "official")
        .count();
    let normalized_signals = signals.iter().filter(|s| s.status == "normalized").count();

    let practice_ids_with_assets: HashSet<&str> = assets
        .iter()
        .filter_map(|asset| asset.practice_id.as_deref())
        .collect();
    let asset_pending = practices
        .iter()
        .filter(|practice| !practice_ids_with_assets.contains(practice.id.as_str()))
        .count();
    let adoptable_practices = practices
        .iter()
        .filter(|practice| practice.status == "draft" || practice.status == "adoptable")
        .count();
    let applied_practices = practices
        .iter()
        .filter(|practice| practice.status == "applied")
        .count();

    let ready_assets = assets
        .iter()
        .filter(|asset| asset.status == "ready")
        .count();
    let projected_assets: HashSet<&str> = projections
        .iter()
        .filter(|projection| projection.status == "active")
        .map(|projection| projection.asset_id.as_str())
        .collect();
    let broken_assets = assets
        .iter()
        .filter(|asset| asset.status == "broken")
        .count();
    let active_claude = projections
        .iter()
        .filter(|projection| {
            projection.target_kind == "claude_code" && projection.status == "active"
        })
        .count();
    let active_codex = projections
        .iter()
        .filter(|projection| projection.target_kind == "codex" && projection.status == "active")
        .count();

    let open_review = projections
        .iter()
        .filter(|projection| matches!(projection.status.as_str(), "broken" | "drifted"))
        .count()
        + broken_assets;
    let missing_projection = assets
        .iter()
        .filter(|asset| !projected_assets.contains(asset.id.as_str()))
        .count();
    let orphan_assets = assets
        .iter()
        .filter(|asset| asset.practice_id.is_none())
        .count();

    let sections = vec![
        LoopSection {
            id: "signals".into(),
            name_zh: "信号".into(),
            name_en: "Signals".into(),
            count: inbox_signals,
            caption_zh: "待整理".into(),
            caption_en: "in inbox".into(),
            metrics: vec![
                metric("高影响", "High impact", high_impact),
                metric("官方来源", "Official", official_signals),
                metric("已规范化", "Normalized", normalized_signals),
            ],
            action_zh: format!("规范化 {} 条信号", inbox_signals.min(6)),
            action_en: format!("Normalize {} signals", inbox_signals.min(6)),
            view: "discover".into(),
            tone: "blue".into(),
        },
        LoopSection {
            id: "practices".into(),
            name_zh: "实践".into(),
            name_en: "Practices".into(),
            count: practices.len(),
            caption_zh: "已沉淀".into(),
            caption_en: "captured".into(),
            metrics: vec![
                metric("可采纳", "Adoptable", adoptable_practices),
                metric("待生成资产", "Assets pending", asset_pending),
                metric("已应用", "Applied", applied_practices),
            ],
            action_zh: format!("准备 {} 个资产", asset_pending.min(3)),
            action_en: format!("Prepare {} assets", asset_pending.min(3)),
            view: "discover".into(),
            tone: "teal".into(),
        },
        LoopSection {
            id: "assets".into(),
            name_zh: "本地资产".into(),
            name_en: "Local Assets".into(),
            count: assets.len(),
            caption_zh: "已登记".into(),
            caption_en: "registered".into(),
            metrics: vec![
                metric("注册表就绪", "Registry ready", ready_assets),
                metric("Claude 已投射", "Claude projected", active_claude),
                metric("Codex 已投射", "Codex projected", active_codex),
            ],
            action_zh: format!("处理 {} 个投射项", missing_projection),
            action_en: format!("Handle {} projections", missing_projection),
            view: "apply".into(),
            tone: "blue".into(),
        },
        LoopSection {
            id: "review".into(),
            name_zh: "评审".into(),
            name_en: "Review".into(),
            count: open_review + missing_projection + orphan_assets,
            caption_zh: "待处理".into(),
            caption_en: "open".into(),
            metrics: vec![
                metric("偏移/断链", "Drift/broken", open_review),
                metric("缺失投射", "Missing", missing_projection),
                metric("孤立资产", "Orphan", orphan_assets),
            ],
            action_zh: format!(
                "评审 {} 个问题",
                open_review + missing_projection + orphan_assets
            ),
            action_en: format!(
                "Review {} issues",
                open_review + missing_projection + orphan_assets
            ),
            view: "insights".into(),
            tone: "purple".into(),
        },
        LoopSection {
            id: "usage".into(),
            name_zh: "用量".into(),
            name_en: "Usage".into(),
            count: signals.len() + practices.len() + assets.len(),
            caption_zh: "本地聚合".into(),
            caption_en: "local aggregate".into(),
            metrics: vec![
                metric("Codex 线程", "Codex threads", 0),
                metric("Claude 会话", "Claude sessions", 0),
                metric("Tokens", "Tokens", 0),
            ],
            action_zh: "查看用量".into(),
            action_en: "Open usage".into(),
            view: "usage".into(),
            tone: "gold".into(),
        },
    ];

    let mut decisions = Vec::new();
    if inbox_signals > 0 {
        decisions.push(decision(
            "规范化信号",
            "Normalize signals",
            "生成 Practice Card 预览",
            "Generate Practice Card previews",
            inbox_signals,
            "info",
            "discover",
        ));
    }
    if asset_pending > 0 {
        decisions.push(decision(
            "准备本地资产",
            "Prepare local assets",
            "把实践关联到可投射资产",
            "Link practices to projectable assets",
            asset_pending,
            "info",
            "discover",
        ));
    }
    if missing_projection > 0 || open_review > 0 {
        decisions.push(decision(
            "评审本地偏移",
            "Review local drift",
            "检查缺失投射、断链和偏移",
            "Inspect missing projections, broken links, and drift",
            missing_projection + open_review,
            "warn",
            "insights",
        ));
    }

    let claude_score = target_score(active_claude, assets.len(), open_review);
    let codex_score = target_score(active_codex, assets.len(), open_review);
    let health_score = ((claude_score as u16 + codex_score as u16) / 2)
        .saturating_sub((missing_projection.min(20) as u16) * 2)
        .max(35) as u8;

    Ok(LoopSummary {
        health_score,
        sections,
        decisions,
        targets: vec![
            TargetHealthSummary {
                name: "Claude Code".into(),
                detail: format!("{active_claude} active projections"),
                score: claude_score,
                status: "projected".into(),
            },
            TargetHealthSummary {
                name: "Codex".into(),
                detail: format!("{active_codex} active projections"),
                score: codex_score,
                status: "projected".into(),
            },
        ],
        recent_audits: audits,
        updated_at: chrono::Utc::now().to_rfc3339(),
        fixture_mode: false,
    })
}

pub fn normalize_signal(
    db: &Database,
    signal_id: &str,
    agent_kind: AgentKind,
) -> Result<NormalizeResult, CommandError> {
    let signal = db.get_signal(signal_id)?;
    db.update_signal_status(signal_id, "processing")?;

    let registry = db.get_active_registry()?;
    let registry_path = registry.as_ref().map(|r| r.path.as_str()).unwrap_or(".");

    let mut variables = HashMap::new();
    variables.insert("signal_title".into(), signal.title.clone());
    variables.insert(
        "signal_source".into(),
        signal.source_url.clone().unwrap_or_else(|| "local".into()),
    );
    variables.insert("source_tier".into(), signal.source_tier.clone());
    variables.insert(
        "signal_excerpt".into(),
        signal.excerpt.clone().unwrap_or_default(),
    );

    let started = std::time::Instant::now();
    let skill_result = skill_service::execute_skill(
        std::path::Path::new(registry_path),
        db,
        "normalize-practice-card",
        &variables,
        agent_kind,
    );
    let duration_ms = started.elapsed().as_millis() as u64;

    match skill_result {
        Ok(result) if result.success => {
            let raw = result.output_json.clone().unwrap_or_default();
            match parse_practice_draft(&raw) {
                Ok(draft) => {
                    let _ = db.insert_audit(&NewAuditEvent {
                        event_type: "signal_normalized_preview".into(),
                        entity_type: Some("signal".into()),
                        entity_id: Some(signal_id.into()),
                        detail: Some(format!(
                            "{{\"title\":\"{}\"}}",
                            escape_json_string(&draft.title)
                        )),
                        outcome: "success".into(),
                    });
                    Ok(NormalizeResult {
                        signal_id: signal_id.into(),
                        success: true,
                        draft: Some(draft),
                        error_code: None,
                        error_message: None,
                        duration_ms: Some(result.duration_ms),
                    })
                }
                Err(error) => {
                    let _ = db.update_signal_status(signal_id, "inbox");
                    let _ = db.insert_audit(&NewAuditEvent {
                        event_type: "signal_normalize_failed".into(),
                        entity_type: Some("signal".into()),
                        entity_id: Some(signal_id.into()),
                        detail: Some("{\"reason\":\"parse_failed\"}".into()),
                        outcome: "failure".into(),
                    });
                    Ok(failed_normalize(
                        signal_id,
                        "ParseFailed",
                        error,
                        duration_ms,
                    ))
                }
            }
        }
        Ok(result) => {
            let _ = db.update_signal_status(signal_id, "inbox");
            let message = result.error.unwrap_or_else(|| "system skill failed".into());
            let _ = db.insert_audit(&NewAuditEvent {
                event_type: "signal_normalize_failed".into(),
                entity_type: Some("signal".into()),
                entity_id: Some(signal_id.into()),
                detail: Some(format!(
                    "{{\"reason\":\"{}\"}}",
                    escape_json_string(&message)
                )),
                outcome: "failure".into(),
            });
            Ok(failed_normalize(
                signal_id,
                "SkillFailed",
                message,
                duration_ms,
            ))
        }
        Err(error) => {
            let _ = db.update_signal_status(signal_id, "inbox");
            let _ = db.insert_audit(&NewAuditEvent {
                event_type: "signal_normalize_failed".into(),
                entity_type: Some("signal".into()),
                entity_id: Some(signal_id.into()),
                detail: Some(format!(
                    "{{\"reason\":\"{}\"}}",
                    escape_json_string(&error.message)
                )),
                outcome: "failure".into(),
            });
            Ok(failed_normalize(
                signal_id,
                error.code,
                error.message,
                duration_ms,
            ))
        }
    }
}

pub fn create_practice_from_signal(
    db: &Database,
    signal_id: &str,
    draft: PracticeDraft,
) -> Result<PracticeCard, CommandError> {
    db.get_signal(signal_id)?;
    let scenarios = serde_json::to_string(&draft.scenarios)?;
    let comparable = serde_json::to_string(&draft.comparable)?;
    let practice = db.insert_practice(&NewPracticeCard {
        title: draft.title,
        practice_type: draft.practice_type,
        summary: Some(draft.summary),
        scenarios: Some(scenarios),
        comparable: Some(comparable),
        applicability: Some(
            if draft.can_generate_asset {
                "can_generate_asset"
            } else {
                "reference_only"
            }
            .into(),
        ),
        generated_by: Some("normalize-practice-card".into()),
    })?;
    db.link_signal_to_practice(signal_id, &practice.id)?;
    db.update_signal_status(signal_id, "normalized")?;
    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "practice_created".into(),
        entity_type: Some("practice".into()),
        entity_id: Some(practice.id.clone()),
        detail: Some(format!(
            "{{\"signalId\":\"{}\"}}",
            escape_json_string(signal_id)
        )),
        outcome: "success".into(),
    });
    Ok(practice)
}

pub fn create_local_asset_from_practice(
    db: &Database,
    practice_id: &str,
    asset_type: &str,
    registry_path: &str,
    is_system: bool,
) -> Result<LocalAsset, CommandError> {
    let practice = db.get_practice(practice_id)?;
    materialize_registry_asset(db, &practice, asset_type, registry_path)?;
    let asset = db.insert_asset(&NewLocalAsset {
        practice_id: Some(practice_id.into()),
        asset_type: asset_type.into(),
        registry_path: registry_path.into(),
        checksum: None,
        is_system,
    })?;
    db.update_practice_status(practice_id, "adoptable")?;
    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "local_asset_created".into(),
        entity_type: Some("local_asset".into()),
        entity_id: Some(asset.id.clone()),
        detail: Some(format!(
            "{{\"practiceId\":\"{}\"}}",
            escape_json_string(practice_id)
        )),
        outcome: "success".into(),
    });
    Ok(asset)
}

fn materialize_registry_asset(
    db: &Database,
    practice: &PracticeCard,
    asset_type: &str,
    registry_path: &str,
) -> Result<(), CommandError> {
    let Some(registry) = db.get_active_registry()? else {
        return Ok(());
    };
    if registry.path == "starter://bundled" || registry.registry_type == "starter" {
        return Ok(());
    }

    let root = PathBuf::from(registry.path);
    let target = root.join(registry_path);
    if is_directory_asset(asset_type, &target) {
        fs::create_dir_all(&target)?;
        fs::write(target.join("SKILL.md"), practice_asset_content(practice, asset_type))?;
    } else {
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&target, practice_asset_content(practice, asset_type))?;
    }
    Ok(())
}

fn is_directory_asset(asset_type: &str, target: &Path) -> bool {
    asset_type == "skill" || target.extension().is_none()
}

fn practice_asset_content(practice: &PracticeCard, asset_type: &str) -> String {
    let summary = practice
        .summary
        .as_deref()
        .unwrap_or("Reusable local harness practice.");
    let scenarios = practice
        .scenarios
        .as_deref()
        .unwrap_or("[]");
    format!(
        "---\nasset_type: {asset_type}\npractice_id: {practice_id}\nstatus: managed-by-hone\n---\n\n# {title}\n\n{summary}\n\n## Scenarios\n\n{scenarios}\n",
        asset_type = asset_type,
        practice_id = practice.id,
        title = practice.title,
        summary = summary,
        scenarios = scenarios,
    )
}

fn parse_practice_draft(raw: &str) -> Result<PracticeDraft, String> {
    let value = serde_json::from_str::<serde_json::Value>(raw.trim()).map_err(|e| e.to_string())?;
    let draft = serde_json::from_value::<PracticeDraft>(value).map_err(|e| e.to_string())?;
    Ok(draft)
}

#[cfg(test)]
mod tests {
    use super::parse_practice_draft;

    const VALID_DRAFT: &str = r#"{
      "title": "Skill discovery guardrail",
      "practiceType": "workflow",
      "summary": "Keep project-scoped skills aligned before agent work.",
      "scenarios": ["Before starting a Trellis implementation"],
      "comparable": ["Manual skill lookup"],
      "canGenerateAsset": true,
      "suggestedAssetTypes": ["skill"]
    }"#;

    #[test]
    fn parse_practice_draft_accepts_strict_json_object() {
        let draft = parse_practice_draft(VALID_DRAFT).expect("draft");

        assert_eq!(draft.title, "Skill discovery guardrail");
        assert_eq!(draft.practice_type, "workflow");
        assert!(draft.can_generate_asset);
    }

    #[test]
    fn parse_practice_draft_rejects_text_wrapped_json() {
        let wrapped = format!("Here is the draft:\n{VALID_DRAFT}");
        let error = parse_practice_draft(&wrapped).expect_err("wrapped JSON should fail");

        assert!(error.contains("expected value") || error.contains("line"));
    }
}

fn failed_normalize(
    signal_id: &str,
    code: impl Into<String>,
    message: impl Into<String>,
    duration_ms: u64,
) -> NormalizeResult {
    NormalizeResult {
        signal_id: signal_id.into(),
        success: false,
        draft: None,
        error_code: Some(code.into()),
        error_message: Some(message.into()),
        duration_ms: Some(duration_ms),
    }
}

fn metric(label_zh: &str, label_en: &str, value: usize) -> LoopMetric {
    LoopMetric {
        label_zh: label_zh.into(),
        label_en: label_en.into(),
        value: value.to_string(),
    }
}

fn decision(
    title_zh: &str,
    title_en: &str,
    detail_zh: &str,
    detail_en: &str,
    count: usize,
    severity: &str,
    view: &str,
) -> LoopDecision {
    LoopDecision {
        title_zh: title_zh.into(),
        title_en: title_en.into(),
        detail_zh: detail_zh.into(),
        detail_en: detail_en.into(),
        count,
        severity: severity.into(),
        view: view.into(),
    }
}

fn target_score(active: usize, total_assets: usize, open_review: usize) -> u8 {
    if total_assets == 0 {
        return 82;
    }
    let projected_ratio = (active as f32 / total_assets as f32).min(1.0);
    let score = (70.0 + projected_ratio * 28.0) as i32 - (open_review.min(8) as i32 * 3);
    score.clamp(35, 98) as u8
}

fn escape_json_string(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}
