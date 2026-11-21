import type { Database } from 'bun:sqlite'
import type { PlaySession } from '../../../shared/activity.ts'
import { transaction } from '../transaction.ts'

export interface LocatedGame {
	readonly gameId: string
	readonly path: string
}

export interface OpenSession {
	readonly id: string
	readonly gameId: string
	readonly startedAt: number
	readonly lastSeenAt: number
}

interface LocationRow {
	readonly game_id: string
	readonly path: string
}

interface OpenRow {
	readonly id: string
	readonly game_id: string
	readonly started_at: number
	readonly last_seen_at: number
}

interface SessionRow {
	readonly id: string
	readonly started_at: number
	readonly ended_at: number | null
	readonly seconds: number
}

export class SqliteActivityRepository {
	private readonly database: Database
	private readonly selectLocations
	private readonly selectOpen
	private readonly insertSession
	private readonly touchSession
	private readonly selectOne
	private readonly endSession
	private readonly deleteSession
	private readonly addPlaytime
	private readonly markPlayed
	private readonly selectRecent

	constructor(database: Database) {
		this.database = database
		this.selectLocations = database.query<LocationRow, []>("SELECT l.game_id, l.path FROM game_locations l JOIN games g ON g.id = l.game_id WHERE g.install_state = 'installed'")
		this.selectOpen = database.query<OpenRow, []>('SELECT id, game_id, started_at, last_seen_at FROM play_sessions WHERE ended_at IS NULL ORDER BY started_at')
		this.insertSession = database.query<unknown, { id: string; gameId: string; at: number }>('INSERT INTO play_sessions (id, game_id, started_at, last_seen_at) VALUES ($id, $gameId, $at, $at)')
		this.touchSession = database.query<unknown, { id: string; at: number }>('UPDATE play_sessions SET last_seen_at = $at WHERE id = $id')
		this.selectOne = database.query<{ game_id: string; started_at: number }, { id: string }>('SELECT game_id, started_at FROM play_sessions WHERE id = $id AND ended_at IS NULL')
		this.endSession = database.query<unknown, { id: string; endedAt: number }>('UPDATE play_sessions SET ended_at = $endedAt, last_seen_at = $endedAt WHERE id = $id')
		this.deleteSession = database.query<unknown, { id: string }>('DELETE FROM play_sessions WHERE id = $id')
		this.addPlaytime = database.query<unknown, { gameId: string; seconds: number; endedAt: number }>('UPDATE games SET playtime_seconds = playtime_seconds + $seconds, last_played_at = $endedAt, updated_at = $endedAt WHERE id = $gameId')
		this.markPlayed = database.query<unknown, { gameId: string; at: number }>('UPDATE games SET last_played_at = $at, updated_at = $at WHERE id = $gameId')
		this.selectRecent = database.query<SessionRow, { gameId: string; limit: number }>(`SELECT id, started_at, ended_at, (COALESCE(ended_at, last_seen_at) - started_at) / 1000 AS seconds FROM play_sessions WHERE game_id = $gameId ORDER BY started_at DESC LIMIT $limit`)
	}

	locations(): readonly LocatedGame[] {
		return this.selectLocations.all().map((row) => ({ gameId: row.game_id, path: row.path }))
	}

	openSessions(): readonly OpenSession[] {
		return this.selectOpen.all().map((row) => ({ id: row.id, gameId: row.game_id, startedAt: row.started_at, lastSeenAt: row.last_seen_at }))
	}

	start(id: string, gameId: string, at: number): void {
		transaction(this.database, () => {
			this.insertSession.run({ id, gameId, at })
			this.markPlayed.run({ gameId, at })
		})
	}

	touch(id: string, at: number): void {
		this.touchSession.run({ id, at })
	}

	/** Ends a session at `endedAt` and adds its length to the game's playtime. Sessions shorter than `minSeconds` are discarded. Returns the seconds credited. */
	finish(id: string, endedAt: number, minSeconds: number): number {
		return transaction(this.database, () => {
			const row = this.selectOne.get({ id })
			if (row === null) return 0
			const seconds = Math.max(0, Math.floor((endedAt - row.started_at) / 1000))
			if (seconds < minSeconds) {
				this.deleteSession.run({ id })
				return 0
			}
			this.endSession.run({ id, endedAt })
			this.addPlaytime.run({ gameId: row.game_id, seconds, endedAt })
			return seconds
		})
	}

	recent(gameId: string, limit: number): readonly PlaySession[] {
		return this.selectRecent.all({ gameId, limit }).map((row) => ({ id: row.id, startedAt: row.started_at, endedAt: row.ended_at, seconds: Math.max(0, row.seconds) }))
	}
}
