pub mod asset_repo;
pub mod audit_repo;
pub mod auth_repo;
pub mod ops_repo;
pub mod practice_repo;
pub mod projection_repo;
pub mod refresh_repo;
pub mod registry_repo;
mod schema;
pub mod signal_repo;
pub mod skill_config_repo;
pub mod source_config_repo;

use std::path::Path;

use rusqlite::Connection;

use crate::domain::errors::CommandError;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, CommandError> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(path).map_err(|e| CommandError::storage(e.to_string()))?;
        let db = Self { conn };
        db.migrate()?;
        Ok(db)
    }

    pub fn open_in_memory() -> Result<Self, CommandError> {
        let conn =
            Connection::open_in_memory().map_err(|e| CommandError::storage(e.to_string()))?;
        let db = Self { conn };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<(), CommandError> {
        let current_version: i32 = self
            .conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .map_err(|e| CommandError::storage(e.to_string()))?;

        for migration in schema::MIGRATIONS {
            if migration.version <= current_version {
                continue;
            }
            self.conn.execute_batch(migration.sql).map_err(|e| {
                CommandError::storage(format!("migration {} failed: {e}", migration.name))
            })?;
            self.conn
                .pragma_update(None, "user_version", migration.version)
                .map_err(|e| {
                    CommandError::storage(format!(
                        "failed to record migration {}: {e}",
                        migration.name
                    ))
                })?;
        }
        Ok(())
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }
}
