use keyring::{Entry, Error as KeyringError};

use crate::domain::errors::CommandError;

const SERVICE_NAME: &str = "com.harness-deck.secrets";

pub fn secret_account(namespace: &str, key: &str) -> Result<String, CommandError> {
    let namespace = namespace.trim();
    let key = key.trim();
    if namespace.is_empty() || key.is_empty() {
        return Err(CommandError::validation(
            "secret namespace and key are required",
        ));
    }
    Ok(format!("{namespace}:{key}"))
}

pub fn set_secret(namespace: &str, key: &str, value: &str) -> Result<(), CommandError> {
    let account = secret_account(namespace, key)?;
    let entry = Entry::new(SERVICE_NAME, &account).map_err(map_keyring_error)?;
    entry.set_password(value).map_err(map_keyring_error)
}

pub fn get_secret(namespace: &str, key: &str) -> Result<Option<String>, CommandError> {
    let account = secret_account(namespace, key)?;
    let entry = Entry::new(SERVICE_NAME, &account).map_err(map_keyring_error)?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => Err(map_keyring_error(error)),
    }
}

pub fn delete_secret(namespace: &str, key: &str) -> Result<(), CommandError> {
    let account = secret_account(namespace, key)?;
    let entry = Entry::new(SERVICE_NAME, &account).map_err(map_keyring_error)?;
    match entry.delete_password() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(error) => Err(map_keyring_error(error)),
    }
}

fn map_keyring_error(error: KeyringError) -> CommandError {
    CommandError::storage(format!("keyring error: {error}"))
}

#[cfg(test)]
mod tests {
    use super::secret_account;

    #[test]
    fn secret_account_namespaces_keys() {
        let account = secret_account("codex", "api-token").expect("account");

        assert_eq!(account, "codex:api-token");
    }

    #[test]
    fn secret_account_rejects_empty_parts() {
        let error = secret_account("", "api-token").expect_err("empty namespace");

        assert_eq!(error.code, "ValidationError");
    }
}
