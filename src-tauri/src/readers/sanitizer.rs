use std::path::PathBuf;

/// Redact values whose keys suggest they hold secrets.
pub fn redact_env_value(key: &str, value: &str) -> String {
    let upper = key.to_uppercase();
    if upper.contains("TOKEN")
        || upper.contains("KEY")
        || upper.contains("SECRET")
        || upper.contains("PASSWORD")
    {
        "[REDACTED]".to_string()
    } else {
        value.to_string()
    }
}

/// Replace $HOME prefix with ~ for display.
pub fn shorten_path(path: &str) -> String {
    if let Ok(home) = std::env::var("HOME") {
        if path.starts_with(&home) {
            return format!("~{}", &path[home.len()..]);
        }
    }
    path.to_string()
}

/// Return the user home directory or a fallback.
pub fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("~"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_secret_keys() {
        assert_eq!(redact_env_value("API_TOKEN", "abc123"), "[REDACTED]");
        assert_eq!(redact_env_value("OPENAI_API_KEY", "sk-xxx"), "[REDACTED]");
        assert_eq!(redact_env_value("DB_PASSWORD", "hunter2"), "[REDACTED]");
        assert_eq!(redact_env_value("MY_SECRET", "shhh"), "[REDACTED]");
    }

    #[test]
    fn passes_through_safe_keys() {
        assert_eq!(redact_env_value("EDITOR", "vim"), "vim");
        assert_eq!(redact_env_value("NODE_ENV", "production"), "production");
    }
}
