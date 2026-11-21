# 0002. SQLite persistence

## Context

Cairn stores its state locally and must remain correct after crashes, upgrades and interrupted writes.

## Decision

- The database is SQLite, accessed through Bun's built-in driver.
- Write-ahead logging is enabled, with foreign keys enforced and strict parameter binding.
- Schema changes are ordered, numbered migrations written in TypeScript and embedded in the application. Each applied migration is recorded with a checksum.
- Released migrations are never edited. Corrections are new migrations.
- Existing databases are backed up before any migration runs.
- Transactions are synchronous and explicit.
- Only repositories under `src/server/database` run SQL. Other code depends on repository interfaces.

## Consequences

- Upgrades are repeatable and recoverable.
- Downgrading is not supported. A database created by a newer version is rejected.
- Each feature adds its own tables in its own migration.
