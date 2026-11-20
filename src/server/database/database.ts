import { chmodSync } from 'node:fs'
import { Database, constants } from 'bun:sqlite'
import { CairnError } from '../../shared/errors.ts'

function restrictPermissions(path: string): void {
	try {
		chmodSync(path, 0o600)
	} catch {
		return
	}
}

/**
 * Opens the database with write-ahead logging, enforced foreign keys and strict parameter binding,
 * then verifies its integrity. Throws a `CairnError` when the file is damaged or unreadable.
 */
export function openDatabase(path: string): Database {
	const database = new Database(path, { create: true, strict: true })
	try {
		database.run('PRAGMA journal_mode = WAL')
		database.run('PRAGMA synchronous = NORMAL')
		database.run('PRAGMA foreign_keys = ON')
		database.run('PRAGMA busy_timeout = 5000')
		const check = database.query('PRAGMA quick_check').values()
		if (check[0]?.[0] !== 'ok') {
			throw new CairnError(
				'database_corrupt',
				'The database failed its integrity check. Run "bun run database list" to see backups and "bun run database restore <file>" to restore one.'
			)
		}
	} catch (error) {
		database.close()
		if (error instanceof CairnError) throw error
		throw new CairnError(
			'io_failed',
			'The database could not be opened. If it is damaged, restore a backup with "bun run database restore <file>".',
			{ cause: error }
		)
	}
	restrictPermissions(path)
	return database
}

/** Checkpoints and closes the database so no write-ahead log files are left behind. */
export function closeDatabase(database: Database): void {
	try {
		database.fileControl(constants.SQLITE_FCNTL_PERSIST_WAL, 0)
		database.run('PRAGMA wal_checkpoint(TRUNCATE)')
	} finally {
		database.close()
	}
}
