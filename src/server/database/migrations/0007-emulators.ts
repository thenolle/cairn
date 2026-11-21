import type { Migration } from '../migrate.ts'

export const emulatorsMigration: Migration = {
	version: 7,
	name: 'create_emulators',
	sql: `CREATE TABLE emulators (
	platform TEXT PRIMARY KEY NOT NULL CHECK (platform IN ('nintendo-switch', 'nintendo-3ds', 'nintendo-ds')),
	name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
	executable TEXT NOT NULL CHECK (length(executable) BETWEEN 1 AND 1024),
	arguments TEXT NOT NULL CHECK (length(arguments) BETWEEN 1 AND 400),
	updated_at INTEGER NOT NULL
)`
}
