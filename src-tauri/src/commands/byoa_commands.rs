use crate::domain::byoa::{AgentAvailability, AgentInvocation, AgentResult};
use crate::domain::errors::CommandError;
use crate::services::byoa_service;

#[tauri::command]
pub fn detect_agents() -> Vec<AgentAvailability> {
    byoa_service::detect_all_agents()
}

#[tauri::command]
pub async fn invoke_agent(invocation: AgentInvocation) -> Result<AgentResult, CommandError> {
    tauri::async_runtime::spawn_blocking(move || {
        byoa_service::invoke_agent(invocation)
    })
    .await
    .map_err(|e| CommandError::subprocess(e.to_string()))?
}
