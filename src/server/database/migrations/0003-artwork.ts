import type { Migration } from '../migrate.ts'

export const artworkMigration: Migration = {
	version: 3,
	name: 'create_artwork',
	sql: `CREATE TABLE artwork (
	game_id TEXT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK (kind IN ('cover', 'hero')),
	file_name TEXT NOT NULL,
	content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
	size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
	updated_at INTEGER NOT NULL,
	PRIMARY KEY (game_id, kind)
)`
}
