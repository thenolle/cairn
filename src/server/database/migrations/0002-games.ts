import type { Migration } from '../migrate.ts'

export const gamesMigration: Migration = {
	version: 2,
	name: 'create_games',
	sql: `CREATE TABLE games (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
	name_key TEXT NOT NULL,
	platform TEXT NOT NULL,
	source TEXT NOT NULL,
	source_id TEXT,
	install_state TEXT NOT NULL CHECK (install_state IN ('installed', 'not_installed', 'unknown')),
	favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
	playtime_seconds INTEGER NOT NULL DEFAULT 0 CHECK (playtime_seconds >= 0),
	last_played_at INTEGER,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX games_source_identity ON games (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX games_name_order ON games (name_key, id);
CREATE INDEX games_added_order ON games (created_at, id);
CREATE INDEX games_platform_name ON games (platform, name_key, id);
CREATE INDEX games_favorite_name ON games (name_key, id) WHERE favorite = 1`
}
