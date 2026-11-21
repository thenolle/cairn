import { maxArtworkBytes } from '../../shared/artwork.ts'
import type { BulkStop, BulkSummary, MetadataOutcome, MetadataStatus } from '../../shared/metadata.ts'
import { normalizeName } from '../../shared/library.ts'
import type { Game } from '../../shared/library.ts'
import type { ArtworkService } from '../library/artwork-service.ts'
import type { LibraryService } from '../library/library-service.ts'
import type { Logger } from '../logging/logger.ts'
import { downloadImage } from './image-download.ts'
import { ProviderError } from './steamgriddb-client.ts'
import type { Fetcher, SgdbImage, SteamGridDbClient } from './steamgriddb-client.ts'

export interface MetadataServiceOptions {
	readonly client: SteamGridDbClient | null
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly logger: Logger
	readonly fetcher?: Fetcher
	readonly now?: () => number
}

type Kind = 'cover' | 'hero'

const allowedMimes: ReadonlySet<string> = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxPerRun = 40
const attemptsPerKind = 2

function candidates(images: readonly SgdbImage[], kind: Kind): SgdbImage[] {
	return images.filter((image) => {
		if (!allowedMimes.has(image.mime) || image.nsfw || image.humor || image.epilepsy || image.width <= 0 || image.height <= 0) return false
		const ratio = image.height / image.width
		return kind === 'cover' ? ratio >= 1.2 && ratio <= 1.8 : 1 / ratio >= 2
	}).sort((a, b) => b.score - a.score).slice(0, attemptsPerKind)
}

/** Fills in missing artwork from SteamGridDB. Artwork you set yourself is never replaced. */
export class MetadataService {
	private readonly client: SteamGridDbClient | null
	private readonly library: LibraryService
	private readonly artwork: ArtworkService
	private readonly logger: Logger
	private readonly fetcher: Fetcher
	private readonly now: () => number
	private running = false
	private last: BulkSummary | null = null

	constructor(options: MetadataServiceOptions) {
		this.client = options.client
		this.library = options.library
		this.artwork = options.artwork
		this.logger = options.logger
		this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
		this.now = options.now ?? Date.now
	}

	available(): boolean {
		return this.client !== null
	}

	status(): MetadataStatus {
		return { configured: this.client !== null, running: this.running, last: this.last }
	}

	async fetchFor(gameId: string): Promise<MetadataOutcome> {
		const game = this.library.get(gameId)
		if (game === undefined) return 'not_found'
		const client = this.client
		if (client === null) return 'unconfigured'
		const existing = this.artwork.urlsOf(game.id)
		const needCover = existing.cover === null
		const needHero = existing.hero === null
		if (!needCover && !needHero) return 'nothing_new'
		try {
			const providerId = await this.resolve(client, game)
			if (providerId === null) return 'no_match'
			let updated = false
			if (needCover) updated = (await this.take(game.id, 'cover', await client.grids(providerId))) || updated
			if (needHero) updated = (await this.take(game.id, 'hero', await client.heroes(providerId))) || updated
			return updated ? 'updated' : 'nothing_new'
		} catch (error) {
			if (error instanceof ProviderError) {
				if (error.kind === 'failed') this.logger.warn('Artwork lookup failed', { id: game.id, reason: error.message })
				return error.kind
			}
			this.logger.error('Artwork lookup failed', { id: game.id, error })
			return 'failed'
		}
	}

	/** Starts a background run over games that lack artwork. Returns false when one is already running or no key is set. */
	startBulk(): boolean {
		if (this.client === null || this.running) return false
		this.running = true
		void this.runBulk().finally(() => {
			this.running = false
		})
		return true
	}

	private async resolve(client: SteamGridDbClient, game: Game): Promise<number | null> {
		if (game.source === 'steam' && game.sourceId !== null) {
			const found = await client.gameBySteamId(game.sourceId)
			if (found !== null) return found.id
		}
		const wanted = normalizeName(game.name)
		const results = await client.search(game.name)
		const exact = results.find((result) => normalizeName(result.name) === wanted)
		if (exact !== undefined) return exact.id
		const prefixed = results.filter((result) => normalizeName(result.name).startsWith(wanted))
		return prefixed.length === 1 ? (prefixed[0]?.id ?? null) : null
	}

	private async take(gameId: string, kind: Kind, images: readonly SgdbImage[]): Promise<boolean> {
		for (const image of candidates(images, kind)) {
			const bytes = await downloadImage(image.url, maxArtworkBytes, this.fetcher)
			if (bytes === null) continue
			const saved = await this.artwork.save(gameId, kind, bytes)
			if (saved.ok) return true
		}
		return false
	}

	private async runBulk(): Promise<void> {
		let checked = 0
		let updated = 0
		let failed = 0
		let stopped: BulkStop | null = null
		let cursor: string | null = null
		outer: do {
			const page = this.library.list({ text: '', platform: null, favoritesOnly: false, sort: 'added', cursor, limit: 100 })
			const art = this.artwork.urlsFor(page.games.map((game) => game.id))
			for (const game of page.games) {
				const entry = art.get(game.id)
				if ((entry?.cover ?? null) !== null && (entry?.hero ?? null) !== null) continue
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
		this.last = { at: this.now(), checked, updated, failed, stopped }
		this.logger.info('Artwork run finished', { checked, updated, failed, stopped })
	}
}
