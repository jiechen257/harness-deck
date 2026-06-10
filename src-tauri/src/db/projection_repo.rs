use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::projection::{Projection, NewProjection};
use super::Database;

impl Database {
    pub fn insert_projection(&self, p: &NewProjection) -> Result<Projection, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO projections (id, asset_id, target_kind, target_path, mode, status, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![id, p.asset_id, p.target_kind, p.target_path, p.mode, "planned", now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_projection(&id)
    }

    pub fn get_projection(&self, id: &str) -> Result<Projection, CommandError> {
        self.conn().query_row(
            "SELECT id, asset_id, target_kind, target_path, mode, status, last_checked, created_at, updated_at FROM projections WHERE id = ?1",
            params![id],
            |row| Ok(Projection {
                id: row.get(0)?,
                asset_id: row.get(1)?,
                target_kind: row.get(2)?,
                target_path: row.get(3)?,
                mode: row.get(4)?,
                status: row.get(5)?,
                last_checked: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_projections_by_asset(&self, asset_id: &str) -> Result<Vec<Projection>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, asset_id, target_kind, target_path, mode, status, last_checked, created_at, updated_at FROM projections WHERE asset_id = ?1 ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map(params![asset_id], |row| Ok(Projection {
            id: row.get(0)?,
            asset_id: row.get(1)?,
            target_kind: row.get(2)?,
            target_path: row.get(3)?,
            mode: row.get(4)?,
            status: row.get(5)?,
            last_checked: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn update_projection_status(&self, id: &str, status: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE projections SET status = ?1, last_checked = ?2, updated_at = ?2 WHERE id = ?3",
            params![status, now, id],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
