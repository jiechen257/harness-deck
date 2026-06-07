use crate::domain::account_workspace::{
    AccountSwitchPreview, AccountWorkspace, AuditEntry, KeychainReference,
};

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
