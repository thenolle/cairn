import pkg from '../../package.json' with { type: 'json' }

export interface RuntimeInfo {
	readonly version: string
	readonly startedAt: string
	readonly schemaVersion: number
	readonly platform: string
	readonly architecture: string
	readonly address: string
}

export interface RuntimeInfoInput {
	readonly schemaVersion: number
	readonly address: string
}

export function createRuntimeInfo(input: RuntimeInfoInput): RuntimeInfo {
	return {
		version: pkg.version,
		startedAt: new Date().toISOString(),
		schemaVersion: input.schemaVersion,
		platform: process.platform,
		architecture: process.arch,
		address: input.address
	}
}
