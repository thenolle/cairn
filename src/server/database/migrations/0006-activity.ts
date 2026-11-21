import type { Migration } from '../migrate.ts'

export const activityMigration: Migration = {
	version: 6,
	name: 'create_activity',
	sql: `CREATE TABLE game_locations (
	game_id TEXT PRIMARY KEY NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	path TEXT NOT NULL CHECK (length(path) BETWEEN 1 AND 1024)
);
CREATE TABLE play_sessions (
	id TEXT PRIMARY KEY NOT NULL,
	game_id TEXT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	started_at INTEGER NOT NULL,
	last_seen_at INTEGER NOT NULL,
	ended_at INTEGER,
	CHECK (last_seen_at >= started_at)
);
CREATE INDEX play_sessions_by_game ON play_sessions (game_id, started_at DESC);
CREATE INDEX play_sessions_open ON play_sessions (ended_at) WHERE ended_at IS NULL`
}
