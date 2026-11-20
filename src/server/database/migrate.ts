import { createHash } from 'node:crypto'
import type { Database } from 'bun:sqlite'
import { appName } from '../../shared/app-info.ts'
import { CairnError } from '../../shared/errors.ts'
import { createBackup, pruneBackups } from './backup.ts'
import { transaction } from './transaction.ts'

/** A schema change. Never edit a released migration: add a new one. */
export interface Migration {
	readonly version: number
	readonly name: string
	readonly sql: string
}

export interface MigrateOptions {
	readonly backupDirectory: string
	readonly keepBackups?: number
	readonly now?: () => number
}

export interface MigrationResult {
	readonly from: number
	readonly to: number
	readonly backupPath: string | null
}

interface AppliedRow {
	readonly version: number
	readonly name: string
	readonly checksum: string
}

function checksum(sql: string): string {
	return createHash('sha256').update(sql).digest('hex')
}

/**
 * Brings the database up to the latest schema. An existing database is backed up first.
 * Refuses databases created by a newer version or whose recorded migrations no longer match.
 */
export function migrate(database: Database, migrations: readonly Migration[], options: MigrateOptions): MigrationResult {
	migrations.forEach((migration, index) => {
		if (migration.version !== index + 1) {
			throw new CairnError('database_incompatible', 'Migrations must be numbered consecutively starting at 1.')
		}
	})

	database.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
	version INTEGER PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	checksum TEXT NOT NULL,
	applied_at INTEGER NOT NULL
)`)

	const applied = database
		.query<AppliedRow, []>('SELECT version, name, checksum FROM schema_migrations ORDER BY version')
		.all()

	applied.forEach((row, index) => {
		const known = migrations[index]
		if (row.version !== index + 1 || known === undefined) {
			throw new CairnError(
				'database_incompatible',
				`This database was created by a newer version of ${appName}. Update ${appName} or restore a compatible backup.`
			)
		}
		if (checksum(known.sql) !== row.checksum) {
			throw new CairnError('database_incompatible', `The database schema does not match this version of ${appName}.`)
		}
	})

	const from = applied.length
	const pending = migrations.slice(from)
	if (pending.length === 0) return { from, to: from, backupPath: null }

	const now = options.now ?? Date.now
	let backupPath: string | null = null
	if (from > 0) {
		backupPath = createBackup(database, options.backupDirectory, 'pre-migration', now())
		pruneBackups(options.backupDirectory, 'pre-migration', options.keepBackups ?? 5)
	}

	const insert = database.query(
		'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES ($version, $name, $checksum, $appliedAt)'
	)

	for (const migration of pending) {
		transaction(database, () => {
			database.run(migration.sql)
			insert.run({
				version: migration.version,
				name: migration.name,
				checksum: checksum(migration.sql),
				appliedAt: now()
			})
		})
	}

	return { from, to: migrations.length, backupPath }
}
