import { artworkKinds } from '../../shared/artwork.ts'
import type { ArtworkKind } from '../../shared/artwork.ts'
import type { BulkStop, BulkSummary, MetadataOutcome, MetadataStatus } from '../../shared/metadata.ts'
import type { SqliteAttemptRepository } from '../database/repositories/attempt-repository.ts'
import type { ArtworkService } from '../library/artwork-service.ts'
import type { LibraryService } from '../library/library-service.ts'
import type { Logger } from '../logging/logger.ts'
import type { ArtworkProvider } from './provider.ts'
import { ProviderError } from './steamgriddb-client.ts'

export interface MetadataServiceOptions {
	readonly providers: readonly ArtworkProvider[]
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly attempts: Pick<SqliteAttemptRepository, 'record' | 'recent'>
	readonly logger: Logger
	readonly now?: () => number
}

export type BulkMode = 'manual' | 'automatic'

const maxPerRun = 40
const attemptsPerKind = 3
const retryAfterMs: Readonly<Record<BulkMode, number>> = { manual: 3_600_000, automatic: 7 * 86_400_000 }

/** Fills in missing artwork from every available source, in order. Artwork you set yourself is never replaced. */
export class MetadataService {
	private readonly providers: readonly ArtworkProvider[]
	private readonly library: LibraryService
	private readonly artwork: ArtworkService
	private readonly attempts: Pick<SqliteAttemptRepository, 'record' | 'recent'>
	private readonly logger: Logger
	private readonly now: () => number
	private running = false
	private last: BulkSummary | null = null

	constructor(options: MetadataServiceOptions) {
		this.providers = options.providers
		this.library = options.library
		this.artwork = options.artwork
		this.attempts = options.attempts
		this.logger = options.logger
		this.now = options.now ?? Date.now
	}

	available(): boolean {
		return this.providers.some((provider) => provider.ready())
	}

	status(): MetadataStatus {
		return {
			providers: this.providers.map((provider) => ({ id: provider.id, name: provider.name, ready: provider.ready(), hint: provider.hint })),
			running: this.running,
			last: this.last
		}
	}

	async fetchFor(gameId: string): Promise<MetadataOutcome> {
		const game = this.library.get(gameId)
		if (game === undefined) return 'not_found'
		if (!this.available()) return 'unconfigured'
		const existing = this.artwork.urlsOf(game.id)
		const missing = new Set<ArtworkKind>(artworkKinds.filter((kind) => existing[kind] === null))
		if (missing.size === 0) return 'nothing_new'
		this.attempts.record(game.id, this.now())
		let added = 0
		let anyOffer = false
		let blocked: 'invalid_key' | 'rate_limited' | null = null
		for (const provider of this.providers) {
			if (missing.size === 0) break
			if (!provider.ready()) continue
			let offers
			try {
				offers = await provider.find(game, missing)
			} catch (error) {
				if (error instanceof ProviderError && (error.kind === 'invalid_key' || error.kind === 'rate_limited')) blocked = error.kind
				else this.logger.warn('Artwork source failed', { source: provider.id, id: game.id, error: error instanceof Error ? error.message : 'unknown' })
				continue
			}
			if (offers.length > 0) anyOffer = true
			for (const kind of [...missing]) {
				const ranked = offers.filter((offer) => offer.kind === kind).sort((a, b) => b.score - a.score).slice(0, attemptsPerKind)
				for (const offer of ranked) {
					let bytes: Uint8Array | null = null
					try {
						bytes = await offer.load()
					} catch {
						bytes = null
					}
					if (bytes === null) continue
					const saved = await this.artwork.save(game.id, kind, bytes)
					if (saved.ok) {
						missing.delete(kind)
						added += 1
						this.logger.info('Artwork added', { source: provider.id, id: game.id, kind })
						break
					}
				}
			}
		}
		if (added > 0) return 'updated'
		if (blocked !== null && !anyOffer) return blocked
		return anyOffer ? 'nothing_new' : 'no_match'
	}

	/** Starts a background run over games that lack artwork. Returns false when one is already running or nothing is available. */
	startBulk(mode: BulkMode): boolean {
		if (this.running || !this.available()) return false
		this.running = true
		void this.runBulk(mode).finally(() => {
			this.running = false
		})
		return true
	}

	private async runBulk(mode: BulkMode): Promise<void> {
		let checked = 0
		let updated = 0
		let failed = 0
		let stopped: BulkStop | null = null
		let cursor: string | null = null
		const since = this.now() - retryAfterMs[mode]
		outer: do {
			const page = this.library.list({ text: '', platform: null, favoritesOnly: false, sort: 'added', cursor, limit: 100 })
			const ids = page.games.map((game) => game.id)
			const art = this.artwork.urlsFor(ids)
			const tried = this.attempts.recent(ids, since)
			for (const game of page.games) {
				const entry = art.get(game.id)
				const complete = (entry?.cover ?? null) !== null && (entry?.hero ?? null) !== null && (entry?.logo ?? null) !== null
				if (complete || tried.has(game.id)) continue
				if (checked >= maxPerRun) {
					stopped = 'limit'
					break outer
				}
				checked += 1
				const outcome = await this.fetchFor(game.id)
				if (outcome === 'updated') updated += 1
				else if (outcome === 'failed') failed += 1
				else if (outcome === 'invalid_key' || outcome === 'rate_limited') {
					stopped = outcome
					break outer
				}
			}
			cursor = page.nextCursor
		} while (cursor !== null)
		if (checked > 0 || mode === 'manual') {
			this.last = { at: this.now(), checked, updated, failed, stopped }
			this.logger.info('Artwork run finished', { mode, checked, updated, failed, stopped })
		}
	}
}
