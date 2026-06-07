use crate::domain::adapter::TargetKind;
use crate::domain::deploy_plan::RiskLevel;
use crate::domain::sync_governance::{
    ConflictItem, DiffEntry, DriftReport, RollbackPreview, SyncGovernance,
};

pub fn build_sync_governance(profile_id: &str, target_kind: TargetKind) -> SyncGovernance {
    let target_path = match target_kind {
        TargetKind::Codex => "~/.codex/AGENTS.md",
        TargetKind::ClaudeCode => "~/.claude/CLAUDE.md",
    };

    SyncGovernance {
        profile_id: profile_id.to_string(),
        target_kind,
        three_way_diff: vec![
            DiffEntry {
                path: target_path.to_string(),
                base_summary: "last manifest had 2 managed rules".to_string(),
                target_summary: "fixture target has 1 unmanaged local rule".to_string(),
                planned_summary: "append scoped managed block and keep local override".to_string(),
                risk: RiskLevel::Medium,
            },
            DiffEntry {
                path: "fixture://skills".to_string(),
                base_summary: "1 skill reference".to_string(),
                target_summary: "2 skill references".to_string(),
                planned_summary: "record skill copy plan in manifest".to_string(),
                risk: RiskLevel::Low,
            },
        ],
        conflicts: vec![ConflictItem {
            id: "conflict-local-rule-overlap".to_string(),
            path: target_path.to_string(),
            summary: "local target rule overlaps with profile rule scope".to_string(),
            resolution: "review before real write; dry-run keeps both entries".to_string(),
            risk: RiskLevel::Medium,
        }],
        drift: DriftReport {
            detected: true,
            count: 2,
            summary: "target differs from last known manifest in rules and skills".to_string(),
        },
        rollback_preview: RollbackPreview {
            backup_required: true,
            manifest_required: true,
            rollback_available_after_real_write: true,
            summary: "real write would create backup snapshot and rollback metadata before applying changes".to_string(),
        },
    }
}
