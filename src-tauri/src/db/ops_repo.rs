use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::ops_script::{OpsScript, NewOpsScript};
use super::Database;

impl Database {
    pub fn insert_ops_script(&self, s: &NewOpsScript) -> Result<OpsScript, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO operations_scripts (id, name, path, description, risk_level, status, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![id, s.name, s.path, s.description, s.risk_level, "registered", now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_ops_script(&id)
    }

    pub fn get_ops_script(&self, id: &str) -> Result<OpsScript, CommandError> {
        self.conn().query_row(
            "SELECT id, name, path, description, risk_level, status, created_at, updated_at FROM operations_scripts WHERE id = ?1",
            params![id],
            |row| Ok(OpsScript {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                description: row.get(3)?,
                risk_level: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_ops_scripts(&self) -> Result<Vec<OpsScript>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, name, path, description, risk_level, status, created_at, updated_at FROM operations_scripts ORDER BY name"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map([], |row| Ok(OpsScript {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            risk_level: row.get(4)?,
            status: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }
}
