use crate::domain::account_workspace::{
    AccountSwitchPreview, AccountWorkspace, AuditEntry, KeychainReference,
};
use crate::domain::app::HealthFactor;
use crate::readers::claude_reader;
use crate::readers::codex_reader;
use crate::readers::sanitizer;

/// Build an AccountWorkspace from real local configuration data.
/// Falls back to fixture_account_workspace() if readers return None.
pub fn real_account_workspace() -> AccountWorkspace {
    let claude_config = claude_reader::read_claude_config();
    let codex_config = codex_reader::read_codex_config();
    let claude_stats = claude_reader::read_claude_stats();

    // If both configs are missing, fall back to fixture
    if claude_config.is_none() && codex_config.is_none() {
        return fixture_account_workspace();
    }

    let default_model = codex_config
        .as_ref()
        .and_then(|c| c.model.clone())
        .or_else(|| {
            claude_stats
                .as_ref()
                .and_then(|s| s.model_usage.first().map(|m| m.model.clone()))
        })
        .unwrap_or_else(|| "claude-opus-4-6".to_string());

    let total_sessions = claude_stats
        .as_ref()
        .map(|s| s.total_sessions)
        .unwrap_or(0);

    let total_cost: f64 = claude_stats
        .as_ref()
        .map(|s| s.model_usage.iter().map(|m| m.cost_usd).sum())
        .unwrap_or(0.0);

    let editor_mode = claude_config
        .as_ref()
        .and_then(|c| c.editor_mode.clone())
        .unwrap_or_else(|| "default".to_string());

    let theme = claude_config
        .as_ref()
        .and_then(|c| c.theme.clone())
        .unwrap_or_else(|| "light".to_string());

    let mcp_names: Vec<String> = {
        let mut names = claude_config
            .as_ref()
            .map(|c| c.mcp_server_names.clone())
            .unwrap_or_default();
        if let Some(codex) = &codex_config {
            for n in &codex.mcp_server_names {
                if !names.contains(n) {
                    names.push(n.clone());
                }
            }
        }
        names
    };

    let sandbox_mode = codex_config
        .as_ref()
        .and_then(|c| c.sandbox_mode.clone())
        .unwrap_or_else(|| "default".to_string());

    let approval_policy = codex_config
        .as_ref()
        .and_then(|c| c.approval_policy.clone())
        .unwrap_or_else(|| "default".to_string());

    let keychain_ref = KeychainReference {
        reference: "keychain://HarnessDeck/display-only".to_string(),
        service: "HarnessDeck.DisplayOnly".to_string(),
        account: "anthropic".to_string(),
        secret_value_stored: false,
        secret_preview: None,
    };

    let provider_label = format!(
        "Anthropic (editor: {}, theme: {}, sandbox: {}, approval: {})",
        editor_mode, theme, sandbox_mode, approval_policy
    );

    AccountWorkspace {
        provider: provider_label,
        base_url: "https://api.anthropic.com/v1".to_string(),
        default_model,
        monthly_budget_usd: total_cost,
        request_limit_per_day: total_sessions,
        token_limit_per_day: claude_stats
            .as_ref()
            .map(|s| {
                s.model_usage
                    .iter()
                    .map(|m| m.input_tokens + m.output_tokens)
                    .sum::<u64>() as u32
            })
            .unwrap_or(0),
        switch_plan_preview: AccountSwitchPreview {
            provider: "Anthropic".to_string(),
            from_model: "current".to_string(),
            to_model: "display-only".to_string(),
            budget_delta_usd: 0.0,
            keychain_reference: keychain_ref.reference.clone(),
            requires_secret_value: false,
            writes_real_config: false,
        },
        audit_trail: vec![
            AuditEntry {
                id: "audit-real-read".to_string(),
                created_at: chrono::Local::now().format("%Y-%m-%d %H:%M").to_string(),
                summary: format!(
                    "Read-only scan: {} MCP servers, {} sessions total, ${:.2} total cost",
                    mcp_names.len(),
                    total_sessions,
                    total_cost
                ),
                severity: "info".to_string(),
            },
            AuditEntry {
                id: "audit-no-writes".to_string(),
                created_at: chrono::Local::now().format("%Y-%m-%d %H:%M").to_string(),
                summary: "writes_real_config: false — display-only mode active".to_string(),
                severity: "info".to_string(),
            },
        ],
        keychain_ref,
    }
}

/// Compute a health score (0-100) from local config state.
/// Returns (score, factors).
pub fn compute_health_score() -> (u32, Vec<HealthFactor>) {
    let home = sanitizer::home_dir();
    let mut factors = Vec::new();

    // +20 if ~/.claude/ exists
    let claude_exists = home.join(".claude").exists();
    factors.push(HealthFactor {
        name: "Claude Code config".to_string(),
        score: if claude_exists { 20 } else { 0 },
        max_score: 20,
        met: claude_exists,
    });

    // +20 if ~/.codex/ exists
    let codex_exists = home.join(".codex").exists();
    factors.push(HealthFactor {
        name: "Codex config".to_string(),
        score: if codex_exists { 20 } else { 0 },
        max_score: 20,
        met: codex_exists,
    });

    // +15 if at least 3 MCP servers configured
    let mcp_count = claude_reader::read_claude_config()
        .map(|c| c.mcp_server_names.len())
        .unwrap_or(0);
    let mcp_met = mcp_count >= 3;
    factors.push(HealthFactor {
        name: format!("MCP coverage ({} servers)", mcp_count),
        score: if mcp_met { 15 } else { 0 },
        max_score: 15,
        met: mcp_met,
    });

    // +15 if at least 10 skills available
    let skill_count = claude_reader::read_claude_config()
        .map(|c| c.skill_count)
        .unwrap_or(0);
    let skill_met = skill_count >= 10;
    factors.push(HealthFactor {
        name: format!("Skill coverage ({} skills)", skill_count),
        score: if skill_met { 15 } else { 0 },
        max_score: 15,
        met: skill_met,
    });

    // +15 if any sessions in last 7 days
    let recent_activity = claude_reader::read_claude_stats()
        .map(|s| {
            let cutoff = chrono::Local::now()
                .date_naive()
                .checked_sub_days(chrono::Days::new(7));
            s.daily_activity.iter().any(|d| {
                if let Some(cutoff_date) = cutoff {
                    chrono::NaiveDate::parse_from_str(&d.date, "%Y-%m-%d")
                        .map(|parsed| parsed >= cutoff_date)
                        .unwrap_or(false)
                } else {
                    false
                }
            })
        })
        .unwrap_or(false);
    factors.push(HealthFactor {
        name: "Recent activity (7d)".to_string(),
        score: if recent_activity { 15 } else { 0 },
        max_score: 15,
        met: recent_activity,
    });

    // +15 if at least 1 plugin installed
    let plugin_count = claude_reader::read_claude_config()
        .map(|c| c.plugin_names.len())
        .unwrap_or(0);
    let plugin_met = plugin_count >= 1;
    factors.push(HealthFactor {
        name: format!("Plugins ({} installed)", plugin_count),
        score: if plugin_met { 15 } else { 0 },
        max_score: 15,
        met: plugin_met,
    });

    let score: u32 = factors.iter().map(|f| f.score).sum();
    (score, factors)
}

pub fn fixture_account_workspace() -> AccountWorkspace {
    let keychain_ref = KeychainReference {
        reference: "keychain://HarnessDeck/accounts/openai".to_string(),
        service: "HarnessDeck.MockKeychain".to_string(),
        account: "openai".to_string(),
        secret_value_stored: false,
        secret_preview: None,
    };
    let workspace = AccountWorkspace {
        provider: "OpenAI".to_string(),
        base_url: "https://api.openai.com/v1".to_string(),
        default_model: "gpt-5-codex".to_string(),
        monthly_budget_usd: 150.0,
        request_limit_per_day: 240,
        token_limit_per_day: 2_000_000,
        switch_plan_preview: AccountSwitchPreview {
            provider: "OpenAI".to_string(),
            from_model: "gpt-5-codex".to_string(),
            to_model: "gpt-5-codex-high-context".to_string(),
            budget_delta_usd: 12.0,
            keychain_reference: keychain_ref.reference.clone(),
            requires_secret_value: false,
            writes_real_config: false,
        },
        audit_trail: vec![
            AuditEntry {
                id: "audit-keychain-ref-linked".to_string(),
                created_at: "fixture-now".to_string(),
                summary: "mock Keychain reference linked without storing a secret value".to_string(),
                severity: "info".to_string(),
            },
            AuditEntry {
                id: "audit-switch-preview".to_string(),
                created_at: "fixture-now".to_string(),
                summary: "switch-plan preview is local-only and does not rewrite provider config".to_string(),
                severity: "info".to_string(),
            },
        ],
        keychain_ref,
    };

    workspace
}

pub fn preview_account_switch(workspace: &AccountWorkspace, to_model: &str) -> AccountSwitchPreview {
    AccountSwitchPreview {
        provider: workspace.provider.clone(),
        from_model: workspace.default_model.clone(),
        to_model: to_model.to_string(),
        budget_delta_usd: 12.0,
        keychain_reference: workspace.keychain_ref.reference.clone(),
        requires_secret_value: false,
        writes_real_config: false,
    }
}
