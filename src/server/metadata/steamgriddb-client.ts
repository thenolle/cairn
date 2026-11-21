export type ProviderErrorKind = 'invalid_key' | 'rate_limited' | 'failed'

export class ProviderError extends Error {
	readonly kind: ProviderErrorKind

	constructor(kind: ProviderErrorKind, message: string) {
		super(message)
		this.name = 'ProviderError'
		this.kind = kind
	}
}

export type SgdbGame = { readonly id: number; readonly name: string }

export type SgdbImage = {
	readonly url: string
	readonly mime: string
	readonly width: number
	readonly height: number
	readonly score: number
	readonly nsfw: boolean
	readonly humor: boolean
	readonly epilepsy: boolean
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export interface SteamGridDbOptions {
	readonly apiKey: string
	readonly fetcher?: Fetcher
	readonly minIntervalMs?: number
	readonly timeoutMs?: number
}

const baseUrl = 'https://www.steamgriddb.com/api/v2'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function dataOf(body: unknown): unknown {
	return isRecord(body) && body['success'] === true ? body['data'] : null
}

function parseGame(value: unknown): SgdbGame | null {
	if (!isRecord(value)) return null
	const id = value['id']
	const name = value['name']
	return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 && typeof name === 'string' ? { id, name } : null
}

function parseImage(value: unknown): SgdbImage | null {
	if (!isRecord(value)) return null
	const { url, mime, width, height } = value
	if (typeof url !== 'string' || typeof mime !== 'string' || typeof width !== 'number' || typeof height !== 'number') return null
	return { url, mime, width, height, score: typeof value['score'] === 'number' ? value['score'] : 0, nsfw: value['nsfw'] === true, humor: value['humor'] === true, epilepsy: value['epilepsy'] === true }
}

const parseImages = (data: unknown): SgdbImage[] => Array.isArray(data) ? (data as unknown[]).map(parseImage).filter((image): image is SgdbImage => image !== null) : []

/** A small SteamGridDB client. Requests run one at a time and are spaced apart. The key is only sent in a header. */
export class SteamGridDbClient {
	private readonly apiKey: string
	private readonly fetcher: Fetcher
	private readonly minIntervalMs: number
	private readonly timeoutMs: number
	private chain: Promise<void> = Promise.resolve()
	private lastRequestAt = 0

	constructor(options: SteamGridDbOptions) {
		this.apiKey = options.apiKey
		this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
		this.minIntervalMs = options.minIntervalMs ?? 600
		this.timeoutMs = options.timeoutMs ?? 15_000
	}

	private request(path: string): Promise<unknown> {
		const run = async (): Promise<unknown> => {
			const wait = this.lastRequestAt + this.minIntervalMs - Date.now()
			if (wait > 0) await Bun.sleep(wait)
			this.lastRequestAt = Date.now()
			let response: Response
			try {
				response = await this.fetcher(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${this.apiKey}`, accept: 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error' })
			} catch {
				throw new ProviderError('failed', 'SteamGridDB could not be reached.')
			}
			if (response.status === 401 || response.status === 403) throw new ProviderError('invalid_key', 'The key was not accepted.')
			if (response.status === 429) throw new ProviderError('rate_limited', 'Too many requests.')
			if (response.status === 404) return null
			if (!response.ok) throw new ProviderError('failed', `SteamGridDB answered ${response.status}.`)
			try { return await response.json() } catch { throw new ProviderError('failed', 'SteamGridDB sent an unreadable answer.') }
		}
		const result = this.chain.then(run, run)
		this.chain = result.then(() => undefined, () => undefined)
		return result
	}

	async gameBySteamId(appId: string): Promise<SgdbGame | null> {
		if (!/^\d{1,10}$/u.test(appId)) return null
		return parseGame(dataOf(await this.request(`/games/steam/${appId}`)))
	}

	async search(term: string): Promise<readonly SgdbGame[]> {
		const trimmed = term.trim().slice(0, 100)
		if (trimmed === '') return []
		const data = dataOf(await this.request(`/search/autocomplete/${encodeURIComponent(trimmed)}`))
		return Array.isArray(data) ? (data as unknown[]).map(parseGame).filter((game): game is SgdbGame => game !== null) : []
	}

	async grids(gameId: number): Promise<readonly SgdbImage[]> {
		if (!Number.isSafeInteger(gameId) || gameId <= 0) return []
		return parseImages(dataOf(await this.request(`/grids/game/${gameId}?dimensions=600x900&nsfw=false&humor=false&epilepsy=false`)))
	}

	async heroes(gameId: number): Promise<readonly SgdbImage[]> {
		if (!Number.isSafeInteger(gameId) || gameId <= 0) return []
		return parseImages(dataOf(await this.request(`/heroes/game/${gameId}?nsfw=false&humor=false&epilepsy=false`)))
	}
}
