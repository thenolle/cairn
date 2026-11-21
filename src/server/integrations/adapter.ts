import type { CapabilityMap, DetailItem, DetectionStatus } from '../../shared/integrations.ts'
import type { InstallState } from '../../shared/library.ts'

export interface DiscoveredGame {
	readonly externalId: string
	readonly name: string
	readonly platform: string
	readonly installState: InstallState
}

export interface Detection {
	readonly status: DetectionStatus
	readonly message: string
	readonly details: readonly DetailItem[]
}

export interface DiscoveryResult {
	readonly games: readonly DiscoveredGame[]
	readonly warnings: readonly string[]
}

/**
 * A source of games. An adapter must declare each capability honestly: anything it does not
 * implement is marked unsupported with a reason. Adapters only read; discovery never modifies the source.
 */
export interface PlatformAdapter {
	readonly id: string
	readonly name: string
	readonly capabilities: CapabilityMap
	detect(): Promise<Detection>
	discover(): Promise<DiscoveryResult>
}
