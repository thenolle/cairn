import type { Database } from 'bun:sqlite'
import type { InstallState } from '../../../shared/library.ts'
import type { DiscoveredGame } from '../../integrations/adapter.ts'
import { transaction } from '../transaction.ts'
import type { GameRepository } from './game-repository.ts'

export interface DiscoveryChanges {
	readonly added: number
	readonly updated: number
	readonly markedNotInstalled: number
}

export interface ApplyOptions {
	readonly now: number
	readonly markMissing: boolean
	readonly newId?: () => string
}

interface SourceRow {
	readonly id: string
	readonly source_id: string
	readonly install_state: InstallState
}

const maxPathLength = 1024

/**
 * Synchronizes games from an external source. New games are added and install state is kept current.
 * Names and other fields are never overwritten, so manual corrections survive, and nothing is deleted.
 * Install folders are recorded so activity can be detected.
 */
export class SqliteDiscoveryRepository {
	private readonly database: Database
	private readonly games: GameRepository
	private readonly selectBySource
	private readonly updateState
	private readonly upsertLocation

	constructor(database: Database, games: GameRepository) {
		this.database = database
		this.games = games
		this.selectBySource = database.query<SourceRow, { source: string }>('SELECT id, source_id, install_state FROM games WHERE source = $source AND source_id IS NOT NULL')
		this.updateState = database.query<unknown, { id: string; state: string; now: number }>('UPDATE games SET install_state = $state, updated_at = $now WHERE id = $id')
		this.upsertLocation = database.query<unknown, { gameId: string; path: string }>('INSERT INTO game_locations (game_id, path) VALUES ($gameId, $path) ON CONFLICT (game_id) DO UPDATE SET path = excluded.path')
	}

	private saveLocation(gameId: string, path: string | undefined): void {
		if (path !== undefined && path.length > 0 && path.length <= maxPathLength) this.upsertLocation.run({ gameId, path })
	}

	apply(source: string, discovered: readonly DiscoveredGame[], options: ApplyOptions): DiscoveryChanges {
		const newId = options.newId ?? (() => crypto.randomUUID())
		return transaction(this.database, () => {
			const known = new Map(this.selectBySource.all({ source }).map((row) => [row.source_id, row]))
			let added = 0
			let updated = 0
			let markedNotInstalled = 0
			for (const game of discovered) {
				const existing = known.get(game.externalId)
				known.delete(game.externalId)
				if (existing === undefined) {
					const id = newId()
					this.games.insert({ id, name: game.name, platform: game.platform, source, sourceId: game.externalId, installState: game.installState, favorite: false, playtimeSeconds: 0, lastPlayedAt: null, createdAt: options.now, updatedAt: options.now })
					this.saveLocation(id, game.installPath)
					added += 1
				} else {
					this.saveLocation(existing.id, game.installPath)
					if (existing.install_state !== game.installState) {
						this.updateState.run({ id: existing.id, state: game.installState, now: options.now })
						updated += 1
					}
				}
			}
			if (options.markMissing) {
				for (const missing of known.values()) {
					if (missing.install_state === 'not_installed') continue
					this.updateState.run({ id: missing.id, state: 'not_installed', now: options.now })
					markedNotInstalled += 1
				}
			}
			return { added, updated, markedNotInstalled }
		})
	}
}
