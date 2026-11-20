import type { Database } from 'bun:sqlite'

let savepointCounter = 0

/**
 * Runs `work` atomically. Commits when it returns and rolls back when it throws.
 * Nested calls become savepoints. `work` must be synchronous: anything after an `await` would run outside the transaction.
 */
export function transaction<T>(database: Database, work: () => T): T {
	if (database.inTransaction) {
		savepointCounter += 1
		const name = `savepoint_${savepointCounter}`
		database.run(`SAVEPOINT ${name}`)
		try {
			const result = work()
			database.run(`RELEASE ${name}`)
			return result
		} catch (error) {
			database.run(`ROLLBACK TO ${name}`)
			database.run(`RELEASE ${name}`)
			throw error
		}
	}

	database.run('BEGIN IMMEDIATE')
	try {
		const result = work()
		database.run('COMMIT')
		return result
	} catch (error) {
		if (database.inTransaction) database.run('ROLLBACK')
		throw error
	}
}
