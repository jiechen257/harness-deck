use rusqlite::params;

use super::Database;
use crate::domain::errors::CommandError;
use crate::domain::refresh::{NewRefreshRecord, RefreshRecord};

impl Database {
    pub fn insert_refresh(&self, r: &NewRefreshRecord) -> Result<RefreshRecord, CommandError> {
        let id = ulid::Ulid::new().to_string();
        self.conn().execute(
            "INSERT INTO refresh_records (id, source_name, source_url, triggered_by, result_count, error_message, outcome, started_at, finished_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![id, r.source_name, r.source_url, r.triggered_by, r.result_count, r.error_message, r.outcome, r.started_at, r.finished_at],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_refresh(&id)
    }

    pub fn get_refresh(&self, id: &str) -> Result<RefreshRecord, CommandError> {
        self.conn().query_row(
            "SELECT id, source_name, source_url, triggered_by, result_count, error_message, outcome, started_at, finished_at FROM refresh_records WHERE id = ?1",
            params![id],
            |row| Ok(RefreshRecord {
                id: row.get(0)?,
                source_name: row.get(1)?,
                source_url: row.get(2)?,
                triggered_by: row.get(3)?,
                result_count: row.get(4)?,
                error_message: row.get(5)?,
                outcome: row.get(6)?,
                started_at: row.get(7)?,
                finished_at: row.get(8)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_recent_refreshes(&self, limit: u32) -> Result<Vec<RefreshRecord>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, source_name, source_url, triggered_by, result_count, error_message, outcome, started_at, finished_at FROM refresh_records ORDER BY started_at DESC LIMIT ?1"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt
            .query_map(params![limit], |row| {
                Ok(RefreshRecord {
                    id: row.get(0)?,
                    source_name: row.get(1)?,
                    source_url: row.get(2)?,
                    triggered_by: row.get(3)?,
                    result_count: row.get(4)?,
                    error_message: row.get(5)?,
                    outcome: row.get(6)?,
                    started_at: row.get(7)?,
                    finished_at: row.get(8)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }
}
