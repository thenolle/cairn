import type { Context } from '@gambrel/core'
import type { IntegrationService } from '../server/integrations/integration-service.ts'
import type { LaunchService } from '../server/launching/launch-service.ts'
import type { ArtworkService } from '../server/library/artwork-service.ts'
import type { CollectionService } from '../server/library/collection-service.ts'
import type { FolderService } from '../server/library/folder-service.ts'
import type { LibraryService } from '../server/library/library-service.ts'
import type { RuntimeInfo } from '../server/runtime-info.ts'

/** What page guards and loaders receive. */
export interface PageContext extends Context {
	readonly runtime: RuntimeInfo
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly integrations: IntegrationService
	readonly folders: FolderService
	readonly collections: CollectionService
	readonly launcher: LaunchService
}
