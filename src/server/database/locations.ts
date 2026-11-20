import { join } from 'node:path'
import type { Directories } from '../platform/paths.ts'

export interface DatabaseLocations {
	readonly file: string
	readonly backups: string
}

export function databaseLocations(directories: Directories): DatabaseLocations {
	return {
		file: join(directories.data, 'cairn.sqlite'),
		backups: join(directories.data, 'backups')
	}
}
