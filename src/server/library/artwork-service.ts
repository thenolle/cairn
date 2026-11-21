import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { artworkUrl, maxArtworkBytes } from '../../shared/artwork.ts'
import type { ArtworkKind, ArtworkUrls } from '../../shared/artwork.ts'
import type { ArtworkRepository } from '../database/repositories/artwork-repository.ts'
import { sniffImageType } from './image-type.ts'
import { isGameId } from './library-service.ts'

export type ArtworkSaveError = 'file_too_large' | 'file_type_invalid'

export type ArtworkSaveResult = { readonly ok: true } | { readonly ok: false; readonly error: ArtworkSaveError }

export interface ArtworkFile {
	readonly file: Blob
	readonly contentType: string
}

export interface ArtworkServiceOptions {
	readonly now?: () => number
}

/** Stores and serves game images. File names come from the image type and the kind, never from user input. */
export class ArtworkService {
	private readonly repository: ArtworkRepository
	private readonly mediaDirectory: string
	private readonly now: () => number

	constructor(repository: ArtworkRepository, mediaDirectory: string, options: ArtworkServiceOptions = {}) {
		this.repository = repository
		this.mediaDirectory = mediaDirectory
		this.now = options.now ?? Date.now
	}

	async save(gameId: string, kind: ArtworkKind, bytes: Uint8Array): Promise<ArtworkSaveResult> {
		if (bytes.byteLength > maxArtworkBytes) return { ok: false, error: 'file_too_large' }
		const type = sniffImageType(bytes)
		if (type === null || !isGameId(gameId)) return { ok: false, error: 'file_type_invalid' }

		const fileName = `${kind}.${type.extension}`
		const directory = join(this.mediaDirectory, gameId)
		const previous = this.repository.find(gameId, kind)

		await Bun.write(join(directory, fileName), bytes)
		this.repository.upsert({
			gameId,
			kind,
			fileName,
			contentType: type.contentType,
			sizeBytes: bytes.byteLength,
			updatedAt: this.now()
		})
		if (previous !== undefined && previous.fileName !== fileName) {
			await rm(join(directory, previous.fileName), { force: true })
		}
		return { ok: true }
	}

	async remove(gameId: string, kind: ArtworkKind): Promise<void> {
		if (!isGameId(gameId)) return
		const record = this.repository.find(gameId, kind)
		if (record === undefined) return
		this.repository.delete(gameId, kind)
		await rm(join(this.mediaDirectory, gameId, record.fileName), { force: true })
	}

	/** Deletes every stored image of a game. Database rows are removed with the game itself. */
	async removeAll(gameId: string): Promise<void> {
		if (!isGameId(gameId)) return
		await rm(join(this.mediaDirectory, gameId), { recursive: true, force: true })
	}

	async file(gameId: string, kind: ArtworkKind): Promise<(ArtworkFile & { readonly updatedAt: number }) | undefined> {
		if (!isGameId(gameId)) return undefined
		const record = this.repository.find(gameId, kind)
		if (record === undefined) return undefined
		const file = Bun.file(join(this.mediaDirectory, gameId, record.fileName))
		if (!(await file.exists())) return undefined
		return { file, contentType: record.contentType, updatedAt: record.updatedAt }
	}

	urlsFor(gameIds: readonly string[]): ReadonlyMap<string, ArtworkUrls> {
		const grouped = new Map<string, { cover: string | null; hero: string | null }>()
		for (const record of this.repository.listForGames([...new Set(gameIds)].slice(0, 100))) {
			const entry = grouped.get(record.gameId) ?? { cover: null, hero: null }
			entry[record.kind] = artworkUrl(record.gameId, record.kind, record.updatedAt)
			grouped.set(record.gameId, entry)
		}
		return grouped
	}

	urlsOf(gameId: string): ArtworkUrls {
		return this.urlsFor([gameId]).get(gameId) ?? { cover: null, hero: null }
	}
}
