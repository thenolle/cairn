import type { Database } from 'bun:sqlite'

/** Remembers when artwork was last looked for, so the same games are not tried again and again. */
export class SqliteAttemptRepository {
	private readonly database: Database
	private readonly upsert

	constructor(database: Database) {
		this.database = database
		this.upsert = database.query<unknown, { gameId: string; at: number }>(`INSERT INTO artwork_attempts (game_id, attempted_at) VALUES ($gameId, $at) ON CONFLICT (game_id) DO UPDATE SET attempted_at = excluded.attempted_at`)
	}

	record(gameId: string, at: number): void {
		this.upsert.run({ gameId, at })
	}

	/** Which of these games were tried since `since`. */
	recent(gameIds: readonly string[], since: number): ReadonlySet<string> {
		if (gameIds.length === 0) return new Set()
		const bindings: Record<string, string | number> = { since }
		const names = gameIds.map((id, index) => {
			bindings[`id${index}`] = id
			return `$id${index}`
		})
		return new Set(this.database.query<{ game_id: string }, Record<string, string | number>>(`SELECT game_id FROM artwork_attempts WHERE attempted_at >= $since AND game_id IN (${names.join(', ')})`).all(bindings).map((row) => row.game_id))
	}
}
