import type { Loader, ParamsOf } from '@gambrel/router'
import type { PageContext } from '../../../context.server.ts'

export type RuntimeView = {
	readonly version: string
	readonly startedAt: string
	readonly uptimeSeconds: number
	readonly schemaVersion: number
	readonly platform: string
	readonly architecture: string
	readonly address: string
}

export const loader: Loader<ParamsOf<'/runtime'>, RuntimeView, PageContext> = ({ context }) => ({
	version: context.runtime.version,
	startedAt: context.runtime.startedAt,
	uptimeSeconds: Math.floor((Date.now() - Date.parse(context.runtime.startedAt)) / 1000),
	schemaVersion: context.runtime.schemaVersion,
	platform: context.runtime.platform,
	architecture: context.runtime.architecture,
	address: context.runtime.address
})
