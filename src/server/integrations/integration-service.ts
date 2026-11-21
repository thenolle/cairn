import type { IntegrationSummary, ScanSummary } from '../../shared/integrations.ts'
import type { SqliteDiscoveryRepository } from '../database/repositories/discovery-repository.ts'
import type { Logger } from '../logging/logger.ts'
import type { Detection, PlatformAdapter } from './adapter.ts'

export interface IntegrationServiceOptions {
	readonly adapters: readonly PlatformAdapter[]
	readonly repository: SqliteDiscoveryRepository
	readonly logger: Logger
	readonly now?: () => number
}

/** Runs adapters, applies their discoveries to the library and remembers the latest result of each. */
export class IntegrationService {
	private readonly adapters: readonly PlatformAdapter[]
	private readonly repository: SqliteDiscoveryRepository
	private readonly logger: Logger
	private readonly now: () => number
	private readonly lastScans = new Map<string, ScanSummary>()
	private readonly running = new Set<string>()

	constructor(options: IntegrationServiceOptions) {
		this.adapters = options.adapters
		this.repository = options.repository
		this.logger = options.logger
		this.now = options.now ?? Date.now
	}

	private async detect(adapter: PlatformAdapter): Promise<Detection> {
		try {
			return await adapter.detect()
		} catch (error) {
			this.logger.error('Detection failed', { adapter: adapter.id, error })
			return { status: 'error', message: 'Detection failed. See the log for details.', details: [] }
		}
	}

	async summaries(): Promise<readonly IntegrationSummary[]> {
		return Promise.all(
			this.adapters.map(async (adapter) => {
				const detection = await this.detect(adapter)
				return {
					id: adapter.id,
					name: adapter.name,
					status: detection.status,
					message: detection.message,
					details: detection.details,
					capabilities: adapter.capabilities,
					lastScan: this.lastScans.get(adapter.id) ?? null
				}
			})
		)
	}

	async scan(adapterId: string): Promise<ScanSummary | undefined> {
		const adapter = this.adapters.find((candidate) => candidate.id === adapterId)
		if (adapter === undefined) return undefined
		if (this.running.has(adapterId)) return this.lastScans.get(adapterId)
		this.running.add(adapterId)
		try {
			const summary = await this.runScan(adapter)
			this.lastScans.set(adapterId, summary)
			return summary
		} finally {
			this.running.delete(adapterId)
		}
	}

	/** Scans every adapter that is ready. Used at startup. */
	async scanReady(): Promise<void> {
		for (const adapter of this.adapters) {
			if ((await this.detect(adapter)).status === 'ready') await this.scan(adapter.id)
		}
	}

	private async runScan(adapter: PlatformAdapter): Promise<ScanSummary> {
		const at = this.now()
		const failed = (message: string): ScanSummary => ({
			adapterId: adapter.id,
			at,
			ok: false,
			message,
			found: 0,
			added: 0,
			updated: 0,
			markedNotInstalled: 0,
			warnings: []
		})
		try {
			const detection = await adapter.detect()
			if (detection.status !== 'ready') return failed(detection.message)
			const discovery = await adapter.discover()
			const changes = this.repository.apply(adapter.id, discovery.games, {
				now: at,
				markMissing: discovery.warnings.length === 0
			})
			this.logger.info('Scan finished', { adapter: adapter.id, found: discovery.games.length, ...changes })
			return {
				adapterId: adapter.id,
				at,
				ok: true,
				message: `Found ${discovery.games.length} games.`,
				found: discovery.games.length,
				...changes,
				warnings: discovery.warnings
			}
		} catch (error) {
			this.logger.error('Scan failed', { adapter: adapter.id, error })
			return failed('The scan could not be completed.')
		}
	}
}
