import type { Migration } from '../migrate.ts'

export const artworkKindsMigration: Migration = {
	version: 8,
	name: 'artwork_kinds_and_attempts',
	sql: `CREATE TABLE artwork_next (
	game_id TEXT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK (kind IN ('cover', 'hero', 'logo', 'icon')),
	file_name TEXT NOT NULL,
	content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
	size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
	updated_at INTEGER NOT NULL,
	PRIMARY KEY (game_id, kind)
);
INSERT INTO artwork_next (game_id, kind, file_name, content_type, size_bytes, updated_at)
	SELECT game_id, kind, file_name, content_type, size_bytes, updated_at FROM artwork;
DROP TABLE artwork;
ALTER TABLE artwork_next RENAME TO artwork;
CREATE TABLE artwork_attempts (
	game_id TEXT PRIMARY KEY NOT NULL REFERENCES games (id) ON DELETE CASCADE,
	attempted_at INTEGER NOT NULL
)`
}
