import { ProviderError } from './steamgriddb-client.ts'
import type { Fetcher } from './steamgriddb-client.ts'

export type IgdbGame = {
	readonly id: number
	readonly name: string
	readonly coverId: string | null
	readonly artworkIds: readonly string[]
	readonly screenshotIds: readonly string[]
}

export interface IgdbOptions {
	readonly clientId: string
	readonly clientSecret: string
	readonly fetcher?: Fetcher
	readonly minIntervalMs?: number
	readonly timeoutMs?: number
}

const imageId = /^[A-Za-z0-9]{4,40}$/u
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const idOf = (value: unknown): string | null => (isRecord(value) && typeof value['image_id'] === 'string' && imageId.test(value['image_id']) ? value['image_id'] : null)

const idsOf = (value: unknown): string[] => Array.isArray(value) ? (value as unknown[]).map(idOf).filter((id): id is string => id !== null) : []

function parseGame(value: unknown): IgdbGame | null {
	if (!isRecord(value) || typeof value['id'] !== 'number' || typeof value['name'] !== 'string') return null
	return {
		id: value['id'],
		name: value['name'],
		coverId: idOf(value['cover']),
		artworkIds: idsOf(value['artworks']),
		screenshotIds: idsOf(value['screenshots'])
	}
}

/** A small IGDB client. Requests run one at a time, below the 4 per second limit. Credentials only go to Twitch and IGDB. */
export class IgdbClient {
	private readonly clientId: string
	private readonly clientSecret: string
	private readonly fetcher: Fetcher
	private readonly minIntervalMs: number
	private readonly timeoutMs: number
	private token: { readonly value: string; readonly expiresAt: number } | null = null
	private chain: Promise<void> = Promise.resolve()
	private lastRequestAt = 0

	constructor(options: IgdbOptions) {
		this.clientId = options.clientId
		this.clientSecret = options.clientSecret
		this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
		this.minIntervalMs = options.minIntervalMs ?? 300
		this.timeoutMs = options.timeoutMs ?? 15_000
	}

	private async accessToken(): Promise<string> {
		const current = this.token
		if (current !== null && current.expiresAt - Date.now() > 3_600_000) return current.value
		let response: Response
		try {
			response = await this.fetcher(`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(this.clientId)}&client_secret=${encodeURIComponent(this.clientSecret)}&grant_type=client_credentials`, { method: 'POST', signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error' })
		} catch {
			throw new ProviderError('failed', 'Twitch could not be reached.')
		}
		if (response.status === 400 || response.status === 401 || response.status === 403) throw new ProviderError('invalid_key', 'The credentials were not accepted.')
		if (!response.ok) throw new ProviderError('failed', `Twitch answered ${response.status}.`)
		const body: unknown = await response.json().catch(() => null)
		if (!isRecord(body) || typeof body['access_token'] !== 'string' || typeof body['expires_in'] !== 'number') throw new ProviderError('failed', 'Twitch sent an unreadable answer.')
		this.token = { value: body['access_token'], expiresAt: Date.now() + body['expires_in'] * 1000 }
		return body['access_token']
	}

	private enqueue<T>(task: () => Promise<T>): Promise<T> {
		const run = async (): Promise<T> => {
			const wait = this.lastRequestAt + this.minIntervalMs - Date.now()
			if (wait > 0) await Bun.sleep(wait)
			this.lastRequestAt = Date.now()
			return task()
		}
		const result = this.chain.then(run, run)
		this.chain = result.then(() => undefined, () => undefined)
		return result
	}

	async search(name: string): Promise<readonly IgdbGame[]> {
		const term = name.replace(/["\\\r\n]/gu, ' ').trim().slice(0, 100)
		if (term === '') return []
		return this.enqueue(async () => {
			const token = await this.accessToken()
			let response: Response
			try {
				response = await this.fetcher('https://api.igdb.com/v4/games', {
					method: 'POST',
					headers: { 'client-id': this.clientId, authorization: `Bearer ${token}`, accept: 'application/json', 'content-type': 'text/plain' },
					body: `search "${term}"; fields name,cover.image_id,artworks.image_id,screenshots.image_id; limit 8;`,
					signal: AbortSignal.timeout(this.timeoutMs),
					redirect: 'error'
				})
			} catch {
				throw new ProviderError('failed', 'IGDB could not be reached.')
			}
			if (response.status === 401 || response.status === 403) {
				this.token = null
				throw new ProviderError('invalid_key', 'IGDB did not accept the credentials.')
			}
			if (response.status === 429) throw new ProviderError('rate_limited', 'Too many requests.')
			if (!response.ok) throw new ProviderError('failed', `IGDB answered ${response.status}.`)
			const body: unknown = await response.json().catch(() => null)
			return Array.isArray(body) ? (body as unknown[]).map(parseGame).filter((game): game is IgdbGame => game !== null) : []
		})
	}
}
