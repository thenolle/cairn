import type { Migration } from '../migrate.ts'
import { sessionsMigration } from './0001-sessions.ts'
import { gamesMigration } from './0002-games.ts'
import { artworkMigration } from './0003-artwork.ts'
import { libraryFoldersMigration } from './0004-library-folders.ts'
import { collectionsMigration } from './0005-collections.ts'
import { activityMigration } from './0006-activity.ts'
import { emulatorsMigration } from './0007-emulators.ts'
import { artworkKindsMigration } from './0008-artwork-kinds.ts'

export const migrations: readonly Migration[] = [
	sessionsMigration,
	gamesMigration,
	artworkMigration,
	libraryFoldersMigration,
	collectionsMigration,
	activityMigration,
	emulatorsMigration,
	artworkKindsMigration
]
