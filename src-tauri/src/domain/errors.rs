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

    pub fn subprocess(message: impl Into<String>) -> Self {
        Self {
            code: "SubprocessError",
            message: message.into(),
        }
    }

    pub fn timeout(message: impl Into<String>) -> Self {
        Self {
            code: "TimeoutError",
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

impl From<toml::de::Error> for CommandError {
    fn from(error: toml::de::Error) -> Self {
        Self::storage(error.to_string())
    }
}

impl From<rusqlite::Error> for CommandError {
    fn from(error: rusqlite::Error) -> Self {
        Self::storage(format!("SQLite error: {error}"))
    }
}

impl From<serde_json::Error> for CommandError {
    fn from(error: serde_json::Error) -> Self {
        Self::storage(format!("JSON error: {error}"))
    }
}
