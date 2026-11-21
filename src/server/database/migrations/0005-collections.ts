import type { Migration } from '../migrate.ts'

export const collectionsMigration: Migration = {
	version: 5,
	name: 'create_collections',
	sql: `CREATE TABLE collections (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
	name_key TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL
);
CREATE TABLE collection_games (
	collection_id TEXT NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
	game_id TEXT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	added_at INTEGER NOT NULL,
	PRIMARY KEY (collection_id, game_id)
);
CREATE INDEX collection_games_by_game ON collection_games (game_id)`
}
