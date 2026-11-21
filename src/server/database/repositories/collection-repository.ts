import type { Database } from 'bun:sqlite'
import type { Collection } from '../../../shared/collections.ts'

interface CollectionRow {
	readonly id: string
	readonly name: string
	readonly created_at: number
	readonly game_count: number
}

const toCollection = (row: CollectionRow): Collection => ({
	id: row.id,
	name: row.name,
	createdAt: row.created_at,
	gameCount: row.game_count
})

export class SqliteCollectionRepository {
	private readonly selectAll
	private readonly selectOne
	private readonly selectForGame
	private readonly insertOne
	private readonly renameOne
	private readonly deleteOne
	private readonly addMember
	private readonly removeMember

	constructor(database: Database) {
		const counted = `SELECT c.id, c.name, c.created_at, COUNT(m.game_id) AS game_count
			FROM collections c LEFT JOIN collection_games m ON m.collection_id = c.id`
		this.selectAll = database.query<CollectionRow, []>(`${counted} GROUP BY c.id ORDER BY c.name_key`)
		this.selectOne = database.query<CollectionRow, { id: string }>(`${counted} WHERE c.id = $id GROUP BY c.id`)
		this.selectForGame = database.query<CollectionRow, { gameId: string }>(
			`SELECT c.id, c.name, c.created_at, 0 AS game_count
			FROM collections c JOIN collection_games m ON m.collection_id = c.id
			WHERE m.game_id = $gameId ORDER BY c.name_key`
		)
		this.insertOne = database.query<unknown, { id: string; name: string; nameKey: string; createdAt: number }>(
			'INSERT INTO collections (id, name, name_key, created_at) VALUES ($id, $name, $nameKey, $createdAt)'
		)
		this.renameOne = database.query<unknown, { id: string; name: string; nameKey: string }>(
			'UPDATE collections SET name = $name, name_key = $nameKey WHERE id = $id'
		)
		this.deleteOne = database.query<unknown, { id: string }>('DELETE FROM collections WHERE id = $id')
		this.addMember = database.query<unknown, { collectionId: string; gameId: string; now: number }>(
			`INSERT OR IGNORE INTO collection_games (collection_id, game_id, added_at)
			SELECT $collectionId, $gameId, $now
			WHERE EXISTS (SELECT 1 FROM collections WHERE id = $collectionId)
			AND EXISTS (SELECT 1 FROM games WHERE id = $gameId)`
		)
		this.removeMember = database.query<unknown, { collectionId: string; gameId: string }>(
			'DELETE FROM collection_games WHERE collection_id = $collectionId AND game_id = $gameId'
		)
	}

	list(): readonly Collection[] {
		return this.selectAll.all().map(toCollection)
	}

	findById(id: string): Collection | undefined {
		const row = this.selectOne.get({ id })
		return row === null ? undefined : toCollection(row)
	}

	forGame(gameId: string): readonly Collection[] {
		return this.selectForGame.all({ gameId }).map(toCollection)
	}

	insert(collection: { id: string; name: string; nameKey: string; createdAt: number }): void {
		this.insertOne.run(collection)
	}

	rename(id: string, name: string, nameKey: string): boolean {
		return this.renameOne.run({ id, name, nameKey }).changes > 0
	}

	delete(id: string): boolean {
		return this.deleteOne.run({ id }).changes > 0
	}

	addGame(collectionId: string, gameId: string, now: number): boolean {
		return this.addMember.run({ collectionId, gameId, now }).changes > 0
	}

	removeGame(collectionId: string, gameId: string): boolean {
		return this.removeMember.run({ collectionId, gameId }).changes > 0
	}
}
