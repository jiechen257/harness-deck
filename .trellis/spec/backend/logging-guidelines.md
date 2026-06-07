# Logging Guidelines

HarnessDeck logging is local-first and privacy-preserving.

## What To Log

- app startup and version
- app data path initialization
- fixture profile loading
- fixture target loading
- deploy plan generation
- dry-run manifest creation
- explicit privacy or real-write confirmation events in future phases

## What Not To Log

- prompts
- source code
- API keys, tokens, bearer strings, private keys
- full user config files
- full local logs imported from other tools

## Audit Trail

Audit trail events are product records, not debug logs. Future real writes, account switches, rollback actions, privacy grants, and Keychain access must be represented as audit events with safe metadata.

## Phase 1

Phase 1 can use simple local logging through Rust stdout/stderr or Tauri logging during development. Do not add remote telemetry.
