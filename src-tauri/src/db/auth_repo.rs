use rusqlite::{params, OptionalExtension};

use super::Database;
use crate::domain::auth_state::AuthorizationEntry;
use crate::domain::errors::CommandError;

const SCOPES: &[&str] = &[
    "registry",
    "local_read",
    "external_signals",
    "write_projection",
    "script_execution",
];

impl Database {
    pub fn seed_authorization(&self) -> Result<(), CommandError> {
        for scope in SCOPES {
            self.conn()
                .execute(
                    "INSERT OR IGNORE INTO authorization_state (scope, granted) VALUES (?1, 0)",
                    params![scope],
                )
                .map_err(|e| CommandError::storage(e.to_string()))?;
        }
        Ok(())
    }

    pub fn get_all_authorizations(&self) -> Result<Vec<AuthorizationEntry>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT scope, granted, granted_at, revoked_at FROM authorization_state ORDER BY scope"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(AuthorizationEntry {
                    scope: row.get(0)?,
                    granted: row.get::<_, i32>(1)? != 0,
                    granted_at: row.get(2)?,
                    revoked_at: row.get(3)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn has_authorization(&self, scope: &str) -> Result<bool, CommandError> {
        Ok(self
            .conn()
            .query_row(
                "SELECT granted FROM authorization_state WHERE scope = ?1",
                params![scope],
                |row| Ok(row.get::<_, i32>(0)? != 0),
            )
            .optional()
            .map_err(|e| CommandError::storage(e.to_string()))?
            .unwrap_or(false))
    }

    pub fn require_authorization(&self, scope: &str) -> Result<(), CommandError> {
        if self.has_authorization(scope)? {
            Ok(())
        } else {
            Err(CommandError::authorization_required(format!(
                "{scope} authorization required"
            )))
        }
    }

    pub fn grant_authorization(&self, scope: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE authorization_state SET granted = 1, granted_at = ?1, revoked_at = NULL WHERE scope = ?2",
            params![now, scope],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }

    pub fn revoke_authorization(&self, scope: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "UPDATE authorization_state SET granted = 0, revoked_at = ?1 WHERE scope = ?2",
                params![now, scope],
            )
            .map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
