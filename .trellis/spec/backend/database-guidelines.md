# Database Guidelines

HarnessDeck is local-first. Persistent state belongs under:

```text
~/Library/Application Support/HarnessDeck/
  harness-deck.db
  profiles/
  manifests/
  backups/
  registry-cache/
  feed-cache/
```

## Phase 1 Persistence

- Use JSON manifest files as the authoritative dry-run deployment record.
- SQLite may be introduced for indexes and app state, but it must not be required for the first dry-run loop unless the schema and migrations are tested.
- Profile fixtures can ship inside `src-tauri/src/fixtures/` and be copied or read into runtime state.

## Future SQLite Rules

- Store indexes, state, usage aggregation, feed cache, insights, and audit trail in SQLite.
- Store full deployment manifests as files and keep only indexable metadata in SQLite.
- Store only secret references in SQLite. Never store API keys, provider tokens, prompts, source code, or complete logs.
- Migrations must be deterministic and covered by tests once SQLite is introduced.

## Backup Rules

- Any future real write path must create a backup before writing.
- A deployment manifest must include backup metadata before the write is considered complete.
- Phase 1 exposes backup design and disabled UI state only; it does not write real config files.
