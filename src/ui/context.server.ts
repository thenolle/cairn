import type { Context } from '@gambrel/core'
import type { RuntimeInfo } from '../server/runtime-info.ts'

/** What page guards and loaders receive. */
export interface PageContext extends Context {
	readonly runtime: RuntimeInfo
}
