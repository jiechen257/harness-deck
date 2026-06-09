use crate::domain::adapter::TargetKind;
use crate::domain::profile::{
    HarnessProfile, McpReference, ProfileMetadata, ProfileSummary, RuleEntry, SkillRef, SyncPolicy,
    ValidationReport,
};
use crate::readers::claude_reader;
use crate::readers::codex_reader;

pub fn list_fixture_profiles() -> Vec<HarnessProfile> {
    vec![
        HarnessProfile {
            id: "macos-dev".to_string(),
            name: "macOS Dev 配置集".to_string(),
            description: "面向 Tauri、Rust 和 macOS app 验证的本地优先配置集。".to_string(),
            rules: vec![
                RuleEntry {
                    id: "local-first-writes".to_string(),
                    title: "Local-first writes".to_string(),
                    body: "Critical config writes must be planned, previewed, backed up, verified, and recorded in a manifest.".to_string(),
                },
                RuleEntry {
                    id: "macos-verification".to_string(),
                    title: "macOS verification".to_string(),
                    body: "Verify macOS desktop changes through Tauri build or app launch evidence.".to_string(),
                },
            ],
            skills: vec![
                SkillRef {
                    id: "build-macos-apps".to_string(),
                    name: "Build macOS Apps".to_string(),
                    source: "local-skill".to_string(),
                },
                SkillRef {
                    id: "verification-before-completion".to_string(),
                    name: "Verification Before Completion".to_string(),
                    source: "local-skill".to_string(),
                },
            ],
            mcp_references: vec![McpReference {
                id: "codex-local".to_string(),
                name: "Codex local workspace".to_string(),
                transport: "stdio".to_string(),
            }],
            targets: vec![TargetKind::Codex, TargetKind::ClaudeCode],
            sync_policy: SyncPolicy::default(),
            metadata: ProfileMetadata::default(),
        },
        HarnessProfile {
            id: "bug-hunt".to_string(),
            name: "Bug Hunt 配置集".to_string(),
            description: "带 fixture 测试和根因分析节奏的排障配置集。".to_string(),
            rules: vec![RuleEntry {
                id: "root-cause-first".to_string(),
                title: "Root cause first".to_string(),
                body: "Find the root cause before proposing fixes.".to_string(),
            }],
            skills: vec![SkillRef {
                id: "hunt".to_string(),
                name: "Systematic debugging".to_string(),
                source: "local-skill".to_string(),
            }],
            mcp_references: vec![],
            targets: vec![TargetKind::Codex, TargetKind::ClaudeCode],
            sync_policy: SyncPolicy::default(),
            metadata: ProfileMetadata::default(),
        },
    ]
}

pub fn list_profile_summaries() -> Vec<ProfileSummary> {
    list_fixture_profiles()
        .iter()
        .map(ProfileSummary::from)
        .collect()
}

pub fn get_fixture_profile(profile_id: &str) -> Option<HarnessProfile> {
    list_fixture_profiles()
        .into_iter()
        .find(|profile| profile.id == profile_id)
}

pub fn validate_profile(profile: &HarnessProfile) -> ValidationReport {
    let mut messages = Vec::new();

    if profile.id.trim().is_empty() {
        messages.push("id is required".to_string());
    }
    if profile.name.trim().is_empty() {
        messages.push("name is required".to_string());
    }
    if profile.rules.is_empty() {
        messages.push("rules must include at least one entry".to_string());
    } else {
        messages.push(format!("rules: {} entries", profile.rules.len()));
    }
    if profile.targets.is_empty() {
        messages.push("targets must include at least one target".to_string());
    }
    if profile.sync_policy.real_writes_allowed {
        messages.push("real writes must stay disabled in fixture mode".to_string());
    }

    let valid = !messages.iter().any(|message| {
        message.contains("required")
            || message.contains("must include")
            || message.contains("real writes")
    });

    ValidationReport { valid, messages }
}

/// Build profiles from real local config data.
/// Returns one "Claude Code" profile if `~/.claude/` exists, and one "Codex"
/// profile if `~/.codex/` exists. Falls back to empty vec on failure.
pub fn build_real_profiles() -> Vec<ProfileSummary> {
    let mut profiles = Vec::new();

    if let Some(claude) = claude_reader::read_claude_config() {
        let mcp_count = claude.mcp_server_names.len();
        let description = format!(
            "{}个 MCP · {}个技能 · {}个 hook · {}个项目",
            mcp_count, claude.skill_count, claude.hook_count, claude.project_count,
        );
        profiles.push(ProfileSummary {
            id: "claude-code-real".to_string(),
            name: "Claude Code".to_string(),
            description,
            rules: claude.permission_allow_count + claude.permission_deny_count,
            skills: claude.skill_count,
            mcp_references: mcp_count,
            targets: vec![TargetKind::ClaudeCode],
        });
    }

    if let Some(codex) = codex_reader::read_codex_config() {
        let mcp_count = codex.mcp_server_names.len();
        let model_label = codex.model.as_deref().unwrap_or("default");
        let description = format!(
            "模型 {} · {}个 MCP · {}个技能 · {}个受信项目",
            model_label, mcp_count, codex.skill_count, codex.trusted_project_count,
        );
        profiles.push(ProfileSummary {
            id: "codex-real".to_string(),
            name: "Codex".to_string(),
            description,
            rules: 0,
            skills: codex.skill_count,
            mcp_references: mcp_count,
            targets: vec![TargetKind::Codex],
        });
    }

    profiles
}
