use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::audit::{AuditEvent, NewAuditEvent};
use super::Database;

impl Database {
    pub fn insert_audit(&self, a: &NewAuditEvent) -> Result<AuditEvent, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO audit_events (id, event_type, entity_type, entity_id, detail, outcome, created_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![id, a.event_type, a.entity_type, a.entity_id, a.detail, a.outcome, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_audit(&id)
    }

    pub fn get_audit(&self, id: &str) -> Result<AuditEvent, CommandError> {
        self.conn().query_row(
            "SELECT id, event_type, entity_type, entity_id, detail, outcome, created_at FROM audit_events WHERE id = ?1",
            params![id],
            |row| Ok(AuditEvent {
                id: row.get(0)?,
                event_type: row.get(1)?,
                entity_type: row.get(2)?,
                entity_id: row.get(3)?,
                detail: row.get(4)?,
                outcome: row.get(5)?,
                created_at: row.get(6)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_audits_by_entity(&self, entity_type: &str, entity_id: &str) -> Result<Vec<AuditEvent>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, event_type, entity_type, entity_id, detail, outcome, created_at FROM audit_events WHERE entity_type = ?1 AND entity_id = ?2 ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map(params![entity_type, entity_id], |row| Ok(AuditEvent {
            id: row.get(0)?,
            event_type: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            detail: row.get(4)?,
            outcome: row.get(5)?,
            created_at: row.get(6)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_recent_audits(&self, limit: u32) -> Result<Vec<AuditEvent>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, event_type, entity_type, entity_id, detail, outcome, created_at FROM audit_events ORDER BY created_at DESC LIMIT ?1"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map(params![limit], |row| Ok(AuditEvent {
            id: row.get(0)?,
            event_type: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            detail: row.get(4)?,
            outcome: row.get(5)?,
            created_at: row.get(6)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }
}
