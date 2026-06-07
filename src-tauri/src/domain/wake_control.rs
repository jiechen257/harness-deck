use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WakeMode {
    StandardAwake,
    TimedAwake,
    DisplaySleep,
    ExperimentalLidAwake,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WakeSession {
    pub mode: WakeMode,
    pub active: bool,
    pub duration_minutes: Option<u32>,
    pub display_sleep_allowed: bool,
    pub experimental: bool,
    pub requires_confirmation: bool,
    pub confirmed: bool,
    pub implementation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WakeControlSummary {
    pub current_state: WakeSession,
    pub quick_actions: Vec<WakeSession>,
}
