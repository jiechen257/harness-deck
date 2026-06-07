use crate::domain::errors::CommandError;
use crate::domain::wake_control::{WakeControlSummary, WakeMode, WakeSession};

pub fn wake_control_summary() -> WakeControlSummary {
    WakeControlSummary {
        current_state: session(WakeMode::StandardAwake, true, None, false, true),
        quick_actions: vec![
            session(WakeMode::StandardAwake, true, None, false, true),
            session(WakeMode::TimedAwake, true, Some(45), false, true),
            session(WakeMode::DisplaySleep, false, None, false, true),
            session(WakeMode::ExperimentalLidAwake, false, Some(30), true, false),
        ],
    }
}

pub fn request_wake_mode(mode: WakeMode, confirmed: bool) -> Result<WakeSession, CommandError> {
    if matches!(mode, WakeMode::ExperimentalLidAwake) && !confirmed {
        return Err(CommandError::authorization_required(
            "experimental lid-awake requires explicit confirmation",
        ));
    }

    Ok(session(
        mode,
        !matches!(mode, WakeMode::DisplaySleep),
        if matches!(mode, WakeMode::TimedAwake | WakeMode::ExperimentalLidAwake) {
            Some(45)
        } else {
            None
        },
        matches!(mode, WakeMode::ExperimentalLidAwake),
        confirmed || !matches!(mode, WakeMode::ExperimentalLidAwake),
    ))
}

fn session(
    mode: WakeMode,
    active: bool,
    duration_minutes: Option<u32>,
    experimental: bool,
    confirmed: bool,
) -> WakeSession {
    WakeSession {
        mode,
        active,
        duration_minutes,
        display_sleep_allowed: matches!(mode, WakeMode::DisplaySleep),
        experimental,
        requires_confirmation: matches!(mode, WakeMode::ExperimentalLidAwake),
        confirmed,
        implementation: "mock/system-safe".to_string(),
    }
}
