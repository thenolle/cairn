import type { Migration } from '../migrate.ts'

export const libraryFoldersMigration: Migration = {
	version: 4,
	name: 'create_library_folders',
	sql: `CREATE TABLE library_folders (
	id TEXT PRIMARY KEY,
	path TEXT NOT NULL UNIQUE CHECK (length(path) BETWEEN 1 AND 1024),
	platform TEXT NOT NULL CHECK (platform IN ('nintendo-switch', 'nintendo-3ds', 'nintendo-ds')),
	created_at INTEGER NOT NULL
)`
}
