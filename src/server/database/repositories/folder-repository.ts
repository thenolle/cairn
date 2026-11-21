import type { Database } from 'bun:sqlite'
import type { LibraryFolder } from '../../../shared/folders.ts'

interface FolderRow {
	readonly id: string
	readonly path: string
	readonly platform: string
	readonly created_at: number
}

export class SqliteFolderRepository {
	private readonly selectAll
	private readonly insertFolder
	private readonly deleteFolder

	constructor(database: Database) {
		this.selectAll = database.query<FolderRow, []>('SELECT id, path, platform, created_at FROM library_folders ORDER BY created_at, id')
		this.insertFolder = database.query<unknown, { id: string; path: string; platform: string; createdAt: number }>(
			'INSERT INTO library_folders (id, path, platform, created_at) VALUES ($id, $path, $platform, $createdAt)'
		)
		this.deleteFolder = database.query<unknown, { id: string }>('DELETE FROM library_folders WHERE id = $id')
	}

	list(): readonly LibraryFolder[] {
		return this.selectAll.all().map((row) => ({ id: row.id, path: row.path, platform: row.platform, createdAt: row.created_at }))
	}

	insert(folder: LibraryFolder): void {
		this.insertFolder.run({ id: folder.id, path: folder.path, platform: folder.platform, createdAt: folder.createdAt })
	}

	remove(id: string): boolean {
		return this.deleteFolder.run({ id }).changes > 0
	}
}
