export const capabilities = [
	'discovery',
	'installationDetection',
	'metadata',
	'launch',
	'install',
	'uninstall',
	'update',
	'configuration',
	'saveDiscovery',
	'saveBackup',
	'saveSync'
] as const

export type Capability = (typeof capabilities)[number]

export const capabilityLabels: Readonly<Record<Capability, string>> = {
	discovery: 'Find games',
	installationDetection: 'Detect installation',
	metadata: 'Artwork and descriptions',
	launch: 'Launch games',
	install: 'Install games',
	uninstall: 'Uninstall games',
	update: 'Update games',
	configuration: 'Configuration',
	saveDiscovery: 'Find saves',
	saveBackup: 'Back up saves',
	saveSync: 'Sync saves'
}

export type CapabilityStatus =
	| { readonly supported: true }
	| { readonly supported: false; readonly reason: string }

export type CapabilityMap = Readonly<Record<Capability, CapabilityStatus>>

export type DetectionStatus = 'ready' | 'not_found' | 'unsupported_platform' | 'error'

export const detectionLabels: Readonly<Record<DetectionStatus, string>> = {
	ready: 'Ready',
	not_found: 'Not found',
	unsupported_platform: 'Not supported here',
	error: 'Problem'
}

export interface DetailItem {
	readonly label: string
	readonly value: string
}

export interface ScanSummary {
	readonly adapterId: string
	readonly at: number
	readonly ok: boolean
	readonly message: string
	readonly found: number
	readonly added: number
	readonly updated: number
	readonly markedNotInstalled: number
	readonly warnings: readonly string[]
}

export interface IntegrationSummary {
	readonly id: string
	readonly name: string
	readonly status: DetectionStatus
	readonly message: string
	readonly details: readonly DetailItem[]
	readonly capabilities: CapabilityMap
	readonly lastScan: ScanSummary | null
}
