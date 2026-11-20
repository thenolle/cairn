import type { Database } from 'bun:sqlite'
import type { SessionRecord, SessionStore } from '../../security/sessions.ts'

interface SessionRow {
	readonly created_at: number
	readonly last_seen_at: number
}

/** Persists browser sessions. Identifiers are token hashes, never the tokens themselves. */
export class SqliteSessionStore implements SessionStore {
	private readonly selectOne
	private readonly upsert
	private readonly remove
	private readonly removeBefore

	constructor(database: Database) {
		this.selectOne = database.query<SessionRow, { id: string }>(
			'SELECT created_at, last_seen_at FROM sessions WHERE id = $id'
		)
		this.upsert = database.query<unknown, { id: string; createdAt: number; lastSeenAt: number }>(
			`INSERT INTO sessions (id, created_at, last_seen_at) VALUES ($id, $createdAt, $lastSeenAt)
			ON CONFLICT (id) DO UPDATE SET last_seen_at = excluded.last_seen_at`
		)
		this.remove = database.query<unknown, { id: string }>('DELETE FROM sessions WHERE id = $id')
		this.removeBefore = database.query<unknown, { createdBefore: number; lastSeenBefore: number }>(
			'DELETE FROM sessions WHERE created_at < $createdBefore OR last_seen_at < $lastSeenBefore'
		)
	}

	get(id: string): SessionRecord | undefined {
		const row = this.selectOne.get({ id })
		return row === null ? undefined : { createdAt: row.created_at, lastSeenAt: row.last_seen_at }
	}

	set(id: string, record: SessionRecord): void {
		this.upsert.run({ id, createdAt: record.createdAt, lastSeenAt: record.lastSeenAt })
	}

	delete(id: string): void {
		this.remove.run({ id })
	}

	deleteBefore(createdBefore: number, lastSeenBefore: number): void {
		this.removeBefore.run({ createdBefore, lastSeenBefore })
	}
}
