import type { Database } from 'bun:sqlite'
import { isArtworkKind } from '../../../shared/artwork.ts'
import type { ArtworkKind } from '../../../shared/artwork.ts'

export interface ArtworkRecord {
	readonly gameId: string
	readonly kind: ArtworkKind
	readonly fileName: string
	readonly contentType: string
	readonly sizeBytes: number
	readonly updatedAt: number
}

export interface ArtworkRepository {
	upsert(record: ArtworkRecord): void
	find(gameId: string, kind: ArtworkKind): ArtworkRecord | undefined
	delete(gameId: string, kind: ArtworkKind): boolean
	listForGames(gameIds: readonly string[]): readonly ArtworkRecord[]
}

interface ArtworkRow {
	readonly game_id: string
	readonly kind: string
	readonly file_name: string
	readonly content_type: string
	readonly size_bytes: number
	readonly updated_at: number
}

function toRecord(row: ArtworkRow): ArtworkRecord | undefined {
	if (!isArtworkKind(row.kind)) return undefined
	return {
		gameId: row.game_id,
		kind: row.kind,
		fileName: row.file_name,
		contentType: row.content_type,
		sizeBytes: row.size_bytes,
		updatedAt: row.updated_at
	}
}

export class SqliteArtworkRepository implements ArtworkRepository {
	private readonly database: Database
	private readonly upsertArtwork
	private readonly selectOne
	private readonly deleteOne

	constructor(database: Database) {
		this.database = database
		this.upsertArtwork = database.query<unknown, { gameId: string; kind: string; fileName: string; contentType: string; sizeBytes: number; updatedAt: number }>(
			`INSERT INTO artwork (game_id, kind, file_name, content_type, size_bytes, updated_at)
			VALUES ($gameId, $kind, $fileName, $contentType, $sizeBytes, $updatedAt)
			ON CONFLICT (game_id, kind) DO UPDATE SET
				file_name = excluded.file_name,
				content_type = excluded.content_type,
				size_bytes = excluded.size_bytes,
				updated_at = excluded.updated_at`
		)
		this.selectOne = database.query<ArtworkRow, { gameId: string; kind: string }>(
			'SELECT * FROM artwork WHERE game_id = $gameId AND kind = $kind'
		)
		this.deleteOne = database.query<unknown, { gameId: string; kind: string }>(
			'DELETE FROM artwork WHERE game_id = $gameId AND kind = $kind'
		)
	}

	upsert(record: ArtworkRecord): void {
		this.upsertArtwork.run({ ...record })
	}

	find(gameId: string, kind: ArtworkKind): ArtworkRecord | undefined {
		const row = this.selectOne.get({ gameId, kind })
		return row === null ? undefined : toRecord(row)
	}

	delete(gameId: string, kind: ArtworkKind): boolean {
		return this.deleteOne.run({ gameId, kind }).changes > 0
	}

	listForGames(gameIds: readonly string[]): readonly ArtworkRecord[] {
		if (gameIds.length === 0) return []
		const bindings: Record<string, string> = {}
		const names = gameIds.map((id, index) => {
			bindings[`id${index}`] = id
			return `$id${index}`
		})
		return this.database
			.query<ArtworkRow, Record<string, string>>(`SELECT * FROM artwork WHERE game_id IN (${names.join(', ')})`)
			.all(bindings)
			.flatMap((row) => toRecord(row) ?? [])
	}
}
