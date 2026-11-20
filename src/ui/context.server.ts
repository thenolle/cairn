import type { Context } from '@gambrel/core'
import type { LibraryService } from '../server/library/library-service.ts'
import type { RuntimeInfo } from '../server/runtime-info.ts'

/** What page guards and loaders receive. */
export interface PageContext extends Context {
	readonly runtime: RuntimeInfo
	readonly library: LibraryService
}
