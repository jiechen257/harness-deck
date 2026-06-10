use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::registry_connection::{RegistryConnection, NewRegistryConnection};
use super::Database;

impl Database {
    pub fn insert_registry(&self, r: &NewRegistryConnection) -> Result<RegistryConnection, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE registry_connections SET is_active = 0, updated_at = ?1",
            params![now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.conn().execute(
            "INSERT INTO registry_connections (id, path, registry_type, is_active, created_at, updated_at)
             VALUES (?1,?2,?3,1,?4,?5)",
            params![id, r.path, r.registry_type, now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_registry(&id)
    }

    pub fn get_registry(&self, id: &str) -> Result<RegistryConnection, CommandError> {
        self.conn().query_row(
            "SELECT id, path, registry_type, is_active, created_at, updated_at FROM registry_connections WHERE id = ?1",
            params![id],
            |row| Ok(RegistryConnection {
                id: row.get(0)?,
                path: row.get(1)?,
                registry_type: row.get(2)?,
                is_active: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn get_active_registry(&self) -> Result<Option<RegistryConnection>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, path, registry_type, is_active, created_at, updated_at FROM registry_connections WHERE is_active = 1 LIMIT 1"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let mut rows = stmt.query_map([], |row| Ok(RegistryConnection {
            id: row.get(0)?,
            path: row.get(1)?,
            registry_type: row.get(2)?,
            is_active: row.get::<_, i32>(3)? != 0,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        match rows.next() {
            Some(Ok(conn)) => Ok(Some(conn)),
            Some(Err(e)) => Err(CommandError::storage(e.to_string())),
            None => Ok(None),
        }
    }
}
