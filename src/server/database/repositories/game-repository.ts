import type { Database } from 'bun:sqlite'
import { isInstallState, normalizeName, searchTokens } from '../../../shared/library.ts'
import type { Game, GameFilter, GameSort } from '../../../shared/library.ts'

export interface KeysetCursor {
	readonly key: string | number
	readonly id: string
}

export interface GameListQuery {
	readonly filter: GameFilter
	readonly sort: GameSort
	readonly after: KeysetCursor | null
	readonly limit: number
}

export interface GameListResult {
	readonly games: readonly Game[]
	readonly next: KeysetCursor | null
}

export interface GameChanges {
	readonly name: string
	readonly platform: string
	readonly updatedAt: number
}

export interface GameRepository {
	insert(game: Game): void
	findById(id: string): Game | undefined
	update(id: string, changes: GameChanges): boolean
	setFavorite(id: string, favorite: boolean, updatedAt: number): boolean
	delete(id: string): boolean
	list(query: GameListQuery): GameListResult
	count(filter: GameFilter): number
}

interface GameRow {
	readonly id: string
	readonly name: string
	readonly name_key: string
	readonly platform: string
	readonly source: string
	readonly source_id: string | null
	readonly install_state: string
	readonly favorite: number
	readonly playtime_seconds: number
	readonly last_played_at: number | null
	readonly created_at: number
	readonly updated_at: number
}

type Bindings = Record<string, string | number>

function toGame(row: GameRow): Game {
	return {
		id: row.id,
		name: row.name,
		platform: row.platform,
		source: row.source,
		sourceId: row.source_id,
		installState: isInstallState(row.install_state) ? row.install_state : 'unknown',
		favorite: row.favorite === 1,
		playtimeSeconds: row.playtime_seconds,
		lastPlayedAt: row.last_played_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}
}

function filterClauses(filter: GameFilter): { clauses: string[]; bindings: Bindings } {
	const clauses: string[] = []
	const bindings: Bindings = {}
	searchTokens(filter.text).forEach((token, index) => {
		clauses.push(`instr(name_key, $token${index}) > 0`)
		bindings[`token${index}`] = token
	})
	if (filter.platform !== null) {
		clauses.push('platform = $platform')
		bindings['platform'] = filter.platform
	}
	if (filter.favoritesOnly) clauses.push('favorite = 1')
	return { clauses, bindings }
}

const whereOf = (clauses: readonly string[]): string => (clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`)

export class SqliteGameRepository implements GameRepository {
	private readonly database: Database
	private readonly insertGame
	private readonly selectById
	private readonly updateGame
	private readonly updateFavorite
	private readonly deleteGame

	constructor(database: Database) {
		this.database = database
		this.insertGame = database.query<unknown, Bindings>(`INSERT INTO games (id, name, name_key, platform, source, source_id, install_state, favorite, playtime_seconds, last_played_at, created_at, updated_at) VALUES ($id, $name, $nameKey, $platform, $source, $sourceId, $installState, $favorite, $playtimeSeconds, $lastPlayedAt, $createdAt, $updatedAt)`)
		this.selectById = database.query<GameRow, { id: string }>('SELECT * FROM games WHERE id = $id')
		this.updateGame = database.query<unknown, { id: string; name: string; nameKey: string; platform: string; updatedAt: number }>('UPDATE games SET name = $name, name_key = $nameKey, platform = $platform, updated_at = $updatedAt WHERE id = $id')
		this.updateFavorite = database.query<unknown, { id: string; favorite: number; updatedAt: number }>('UPDATE games SET favorite = $favorite, updated_at = $updatedAt WHERE id = $id')
		this.deleteGame = database.query<unknown, { id: string }>('DELETE FROM games WHERE id = $id')
	}

	insert(game: Game): void {
		this.insertGame.run({
			id: game.id,
			name: game.name,
			nameKey: normalizeName(game.name),
			platform: game.platform,
			source: game.source,
			sourceId: game.sourceId,
			installState: game.installState,
			favorite: game.favorite ? 1 : 0,
			playtimeSeconds: game.playtimeSeconds,
			lastPlayedAt: game.lastPlayedAt,
			createdAt: game.createdAt,
			updatedAt: game.updatedAt
		} as Bindings)
	}

	findById(id: string): Game | undefined {
		const row = this.selectById.get({ id })
		return row === null ? undefined : toGame(row)
	}

	update(id: string, changes: GameChanges): boolean {
		return (
			this.updateGame.run({
				id,
				name: changes.name,
				nameKey: normalizeName(changes.name),
				platform: changes.platform,
				updatedAt: changes.updatedAt
			}).changes > 0
		)
	}

	setFavorite(id: string, favorite: boolean, updatedAt: number): boolean {
		return this.updateFavorite.run({ id, favorite: favorite ? 1 : 0, updatedAt }).changes > 0
	}

	delete(id: string): boolean {
		return this.deleteGame.run({ id }).changes > 0
	}

	list(query: GameListQuery): GameListResult {
		const { clauses, bindings } = filterClauses(query.filter)
		if (query.after !== null) {
			clauses.push(query.sort === 'name' ? '(name_key, id) > ($afterKey, $afterId)' : '(created_at, id) < ($afterKey, $afterId)')
			bindings['afterKey'] = query.after.key
			bindings['afterId'] = query.after.id
		}
		bindings['limit'] = query.limit + 1
		const order = query.sort === 'name' ? 'name_key ASC, id ASC' : 'created_at DESC, id DESC'
		const rows = this.database.query<GameRow, Bindings>(`SELECT * FROM games ${whereOf(clauses)} ORDER BY ${order} LIMIT $limit`).all(bindings)
		const page = rows.slice(0, query.limit)
		const last = page[page.length - 1]
		const next = rows.length > query.limit && last !== undefined ? { key: query.sort === 'name' ? last.name_key : last.created_at, id: last.id } : null
		return { games: page.map(toGame), next }
	}

	count(filter: GameFilter): number {
		const { clauses, bindings } = filterClauses(filter)
		const row = this.database.query<{ total: number }, Bindings>(`SELECT COUNT(*) AS total FROM games ${whereOf(clauses)}`).get(bindings)
		return row?.total ?? 0
	}
}
