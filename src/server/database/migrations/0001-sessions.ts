import type { Migration } from '../migrate.ts'

export const sessionsMigration: Migration = {
	version: 1,
	name: 'create_sessions',
	sql: `CREATE TABLE sessions (
	id TEXT PRIMARY KEY NOT NULL,
	created_at INTEGER NOT NULL,
	last_seen_at INTEGER NOT NULL
)`
}
