import type { LaunchOutcome } from '../../shared/launch.ts'
import type { PlatformAdapter } from '../integrations/adapter.ts'
import type { LibraryService } from '../library/library-service.ts'
import type { Logger } from '../logging/logger.ts'
import { isAllowedLaunchUrl } from '../os/open-url.ts'
import type { UrlOpener } from '../os/open-url.ts'

export interface LaunchServiceOptions {
	readonly library: LibraryService
	readonly adapters: readonly PlatformAdapter[]
	readonly opener: UrlOpener
	readonly logger: Logger
	readonly now?: () => number
}

const cooldownMs = 3000

/** Starts games through the launcher they came from. Only installed games from adapters that can launch are started. */
export class LaunchService {
	private readonly library: LibraryService
	private readonly adapters: readonly PlatformAdapter[]
	private readonly opener: UrlOpener
	private readonly logger: Logger
	private readonly now: () => number
	private readonly recent = new Map<string, number>()

	constructor(options: LaunchServiceOptions) {
		this.library = options.library
		this.adapters = options.adapters
		this.opener = options.opener
		this.logger = options.logger
		this.now = options.now ?? Date.now
	}

	/** Whether games from this source can be started at all. */
	canLaunch(source: string): boolean {
		return this.adapters.some((adapter) => adapter.id === source && adapter.prepareLaunch !== undefined)
	}

	async launch(gameId: string): Promise<LaunchOutcome> {
		const game = this.library.get(gameId)
		if (game === undefined) return 'not_found'
		if (game.installState !== 'installed') return 'not_installed'

		const adapter = this.adapters.find((candidate) => candidate.id === game.source)
		if (adapter?.prepareLaunch === undefined || game.sourceId === null) return 'unsupported'

		const at = this.now()
		const last = this.recent.get(game.id)
		if (last !== undefined && at - last < cooldownMs) return 'busy'
		this.recent.set(game.id, at)

		try {
			const plan = await adapter.prepareLaunch(game.sourceId)
			if (plan === null) return 'unavailable'
			if (plan.kind !== 'url' || !isAllowedLaunchUrl(plan.url)) {
				this.logger.warn('Launch plan refused', { adapter: adapter.id, id: game.id })
				return 'failed'
			}
			if (!(await this.opener(plan.url))) {
				this.logger.warn('Launch request failed', { adapter: adapter.id, id: game.id })
				return 'failed'
			}
			this.library.markLaunched(game.id)
			this.logger.info('Launch requested', { adapter: adapter.id, id: game.id })
			return 'started'
		} catch (error) {
			this.logger.error('Launch failed', { adapter: adapter.id, id: game.id, error })
			return 'failed'
		}
	}
}
