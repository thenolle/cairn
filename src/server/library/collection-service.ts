import { collectionNameMax } from '../../shared/collections.ts'
import type { Collection, CollectionError } from '../../shared/collections.ts'
import { normalizeName } from '../../shared/library.ts'
import type { SqliteCollectionRepository } from '../database/repositories/collection-repository.ts'
import { isGameId } from './library-service.ts'

export type CollectionResult =
	| { readonly ok: true; readonly collection: Collection }
	| { readonly ok: false; readonly error: CollectionError }

export interface CollectionServiceOptions {
	readonly now?: () => number
	readonly newId?: () => string
}

const fail = (error: CollectionError): CollectionResult => ({ ok: false, error })

function parseName(raw: string): string | null {
	const name = raw.replace(/\p{Cc}/gu, ' ').replace(/\s+/gu, ' ').trim()
	return name === '' || name.length > collectionNameMax ? null : name
}

/** Collections group games your own way. Removing a collection never removes games. */
export class CollectionService {
	private readonly repository: SqliteCollectionRepository
	private readonly now: () => number
	private readonly newId: () => string

	constructor(repository: SqliteCollectionRepository, options: CollectionServiceOptions = {}) {
		this.repository = repository
		this.now = options.now ?? Date.now
		this.newId = options.newId ?? (() => crypto.randomUUID())
	}

	list(): readonly Collection[] {
		return this.repository.list()
	}

	get(id: string): Collection | undefined {
		return isGameId(id) ? this.repository.findById(id) : undefined
	}

	forGame(gameId: string): readonly Collection[] {
		return isGameId(gameId) ? this.repository.forGame(gameId) : []
	}

	create(rawName: string): CollectionResult {
		const name = parseName(rawName)
		if (name === null) return fail('invalid_name')
		const collection = { id: this.newId(), name, nameKey: normalizeName(name), createdAt: this.now() }
		try {
			this.repository.insert(collection)
		} catch {
			return fail('duplicate')
		}
		return { ok: true, collection: { id: collection.id, name, createdAt: collection.createdAt, gameCount: 0 } }
	}

	rename(id: string, rawName: string): CollectionResult {
		const name = parseName(rawName)
		if (name === null) return fail('invalid_name')
		if (!isGameId(id)) return fail('not_found')
		let changed: boolean
		try {
			changed = this.repository.rename(id, name, normalizeName(name))
		} catch {
			return fail('duplicate')
		}
		const collection = changed ? this.repository.findById(id) : undefined
		return collection === undefined ? fail('not_found') : { ok: true, collection }
	}

	remove(id: string): boolean {
		return isGameId(id) && this.repository.delete(id)
	}

	addGame(collectionId: string, gameId: string): boolean {
		return isGameId(collectionId) && isGameId(gameId) && this.repository.addGame(collectionId, gameId, this.now())
	}

	removeGame(collectionId: string, gameId: string): boolean {
		return isGameId(collectionId) && isGameId(gameId) && this.repository.removeGame(collectionId, gameId)
	}
}
