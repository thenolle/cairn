import type { Game, GameFilter, GamePage, GameQuery, GameSort } from '../../shared/library.ts'
import type { GameRepository, KeysetCursor } from '../database/repositories/game-repository.ts'
import type { GameInput } from './game-input.ts'

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const defaultPageSize = 48
const maxPageSize = 100

function encodeCursor(cursor: KeysetCursor): string {
	return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

function decodeCursor(raw: string | null, sort: GameSort): KeysetCursor | null {
	if (raw === null || raw.length > 512) return null
	try {
		const value: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
		if (typeof value !== 'object' || value === null || !('key' in value) || !('id' in value)) return null
		const { key, id } = value
		if (typeof id !== 'string') return null
		if (sort === 'name' && typeof key === 'string') return { key, id }
		if (sort === 'added' && typeof key === 'number') return { key, id }
	} catch {
		return null
	}
	return null
}

export interface LibraryServiceOptions {
	readonly now?: () => number
	readonly newId?: () => string
}

/** The library's use cases. Validation of form input happens before these methods are called. */
export class LibraryService {
	private readonly repository: GameRepository
	private readonly now: () => number
	private readonly newId: () => string

	constructor(repository: GameRepository, options: LibraryServiceOptions = {}) {
		this.repository = repository
		this.now = options.now ?? Date.now
		this.newId = options.newId ?? (() => crypto.randomUUID())
	}

	add(input: GameInput): Game {
		const now = this.now()
		const game: Game = {
			id: this.newId(),
			name: input.name,
			platform: input.platform,
			source: 'manual',
			sourceId: null,
			installState: 'unknown',
			favorite: false,
			playtimeSeconds: 0,
			lastPlayedAt: null,
			createdAt: now,
			updatedAt: now
		}
		this.repository.insert(game)
		return game
	}

	get(id: string): Game | undefined {
		return idPattern.test(id) ? this.repository.findById(id) : undefined
	}

	update(id: string, input: GameInput): Game | undefined {
		if (!idPattern.test(id)) return undefined
		const changed = this.repository.update(id, { name: input.name, platform: input.platform, updatedAt: this.now() })
		return changed ? this.repository.findById(id) : undefined
	}

	setFavorite(id: string, favorite: boolean): boolean {
		return idPattern.test(id) && this.repository.setFavorite(id, favorite, this.now())
	}

	markLaunched(id: string): boolean {
		return idPattern.test(id) && this.repository.markLaunched(id, this.now())
	}

	recentlyPlayed(limit = 12): readonly Game[] {
		return this.repository.listRecentlyPlayed(Math.min(Math.max(limit, 1), maxPageSize))
	}

	mostPlayed(limit = 10): readonly Game[] {
		return this.repository.listMostPlayed(Math.min(Math.max(limit, 1), maxPageSize))
	}

	remove(id: string): boolean {
		return idPattern.test(id) && this.repository.delete(id)
	}

	list(query: GameQuery): GamePage {
		const limit = Math.min(Math.max(query.limit ?? defaultPageSize, 1), maxPageSize)
		const result = this.repository.list({
			filter: { text: query.text, platform: query.platform, favoritesOnly: query.favoritesOnly, collectionId: query.collectionId ?? null },
			sort: query.sort,
			after: decodeCursor(query.cursor, query.sort),
			limit
		})
		return { games: result.games, nextCursor: result.next === null ? null : encodeCursor(result.next) }
	}

	count(filter: GameFilter): number {
		return this.repository.count(filter)
	}
}

export function isGameId(value: string): boolean {
	return idPattern.test(value)
}
