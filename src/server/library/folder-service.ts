import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { isFolderPlatform } from '../../shared/folders.ts'
import type { FolderError, LibraryFolder } from '../../shared/folders.ts'
import type { SqliteFolderRepository } from '../database/repositories/folder-repository.ts'

export type FolderResult =
	| { readonly ok: true; readonly folder: LibraryFolder }
	| { readonly ok: false; readonly error: FolderError }

export interface FolderServiceOptions {
	/** Whether two paths that differ only by letter case are the same folder. */
	readonly caseInsensitive: boolean
	readonly newId?: () => string
	readonly now?: () => number
}

async function isDirectory(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isDirectory()
	} catch {
		return false
	}
}

const fail = (error: FolderError): FolderResult => ({ ok: false, error })

/** Manages the folders Cairn scans for game files. */
export class FolderService {
	private readonly repository: SqliteFolderRepository
	private readonly caseInsensitive: boolean
	private readonly newId: () => string
	private readonly now: () => number

	constructor(repository: SqliteFolderRepository, options: FolderServiceOptions) {
		this.repository = repository
		this.caseInsensitive = options.caseInsensitive
		this.newId = options.newId ?? (() => crypto.randomUUID())
		this.now = options.now ?? Date.now
	}

	list(): readonly LibraryFolder[] {
		return this.repository.list()
	}

	async add(rawPath: string, rawPlatform: string): Promise<FolderResult> {
		const path = rawPath.trim()
		if (path === '' || path.length > 1024 || path.includes('\0') || !isAbsolute(path)) return fail('invalid_path')
		if (!isFolderPlatform(rawPlatform)) return fail('invalid_platform')

		const resolved = resolve(path)
		if (!(await isDirectory(resolved))) return fail('not_a_folder')

		const key = this.compareKey(resolved)
		if (this.repository.list().some((folder) => this.compareKey(folder.path) === key)) return fail('duplicate')

		const folder: LibraryFolder = { id: this.newId(), path: resolved, platform: rawPlatform, createdAt: this.now() }
		try {
			this.repository.insert(folder)
		} catch {
			return fail('duplicate')
		}
		return { ok: true, folder }
	}

	remove(id: string): boolean {
		return this.repository.remove(id)
	}

	private compareKey(path: string): string {
		return this.caseInsensitive ? path.toLowerCase() : path
	}
}
