use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

impl CommandError {
    pub fn authorization_required(message: impl Into<String>) -> Self {
        Self {
            code: "AuthorizationRequired",
            message: message.into(),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: "ValidationError",
            message: message.into(),
        }
    }

    pub fn plan_blocked(message: impl Into<String>) -> Self {
        Self {
            code: "PlanBlocked",
            message: message.into(),
        }
    }

    pub fn storage(message: impl Into<String>) -> Self {
        Self {
            code: "StorageError",
            message: message.into(),
        }
    }
}

impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        Self::storage(error.to_string())
    }
}

impl From<tauri::Error> for CommandError {
    fn from(error: tauri::Error) -> Self {
        Self::storage(error.to_string())
    }
}
