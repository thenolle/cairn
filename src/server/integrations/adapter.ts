import type { CapabilityMap, DetailItem, DetectionStatus } from '../../shared/integrations.ts'
import type { InstallState } from '../../shared/library.ts'

export interface DiscoveredGame {
	readonly externalId: string
	readonly name: string
	readonly platform: string
	readonly installState: InstallState
	readonly installPath?: string | undefined
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
	/** Describes how to start a game, or null when it cannot be started. Adapters without this cannot launch. */
	prepareLaunch?(externalId: string): Promise<LaunchPlan | null>
}

/** What an adapter wants started. The launch service validates and performs it; adapters never start processes. */
export type LaunchPlan =
	| { readonly kind: 'url'; readonly url: string }
	| { readonly kind: 'process'; readonly executable: string; readonly args: readonly string[]; readonly cwd: string }
	| { readonly kind: 'problem'; readonly outcome: 'no_emulator' | 'unavailable' }

export type ProcessPlan = Extract<LaunchPlan, { kind: 'process' }>
