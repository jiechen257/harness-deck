use crate::domain::account_workspace::{AccountSwitchPreview, AccountWorkspace};
use crate::services::account_service::{
    fixture_account_workspace, preview_account_switch as build_account_switch_preview,
};

#[tauri::command]
pub fn get_account_workspace() -> AccountWorkspace {
    fixture_account_workspace()
}

#[tauri::command]
pub fn preview_account_switch(to_model: String) -> AccountSwitchPreview {
    let workspace = fixture_account_workspace();
    build_account_switch_preview(&workspace, &to_model)
}
