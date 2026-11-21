import { maxArtworkBytes } from '../../../shared/artwork.ts'
import type { ArtworkKind } from '../../../shared/artwork.ts'
import type { Game } from '../../../shared/library.ts'
import { downloadImage, isAllowedImageHost } from '../image-download.ts'
import { pickByName } from '../matching.ts'
import type { ArtworkOffer, ArtworkProvider } from '../provider.ts'
import type { Fetcher, SgdbImage, SteamGridDbClient } from '../steamgriddb-client.ts'

const mimes: ReadonlySet<string> = new Set(['image/png', 'image/jpeg', 'image/webp'])

function fits(image: SgdbImage, kind: ArtworkKind): boolean {
	if (!mimes.has(image.mime) || image.nsfw || image.humor || image.epilepsy || image.width <= 0 || image.height <= 0) return false
	const tall = image.height / image.width
	if (kind === 'cover') return tall >= 1.2 && tall <= 1.8
	if (kind === 'hero') return 1 / tall >= 2
	if (kind === 'logo') return image.mime !== 'image/jpeg'
	return tall >= 0.9 && tall <= 1.1
}

export interface SteamGridDbProviderOptions {
	readonly client: SteamGridDbClient | null
	readonly fetcher?: Fetcher
}

export function createSteamGridDbProvider(options: SteamGridDbProviderOptions): ArtworkProvider {
	const { client } = options
	const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
	const offersFrom = (images: readonly SgdbImage[], kind: ArtworkKind): ArtworkOffer[] =>images.filter((image) => fits(image, kind)).sort((a, b) => b.score - a.score).slice(0, 3).map((image) => ({ kind, score: image.score, load: () => downloadImage(image.url, maxArtworkBytes, fetcher, isAllowedImageHost) }))
	const resolve = async (api: SteamGridDbClient, game: Game): Promise<number | null> => {
		if (game.source === 'steam' && game.sourceId !== null) {
			const found = await api.gameBySteamId(game.sourceId)
			if (found !== null) return found.id
		}
		return pickByName(await api.search(game.name), game.name)?.id ?? null
	}
	return {
		id: 'steamgriddb',
		name: 'SteamGridDB',
		hint: 'Set CAIRN_STEAMGRIDDB_KEY to a free key from your SteamGridDB preferences.',
		ready: () => client !== null,
		async find(game, wanted): Promise<readonly ArtworkOffer[]> {
			if (client === null) return []
			const id = await resolve(client, game)
			if (id === null) return []
			const offers: ArtworkOffer[] = []
			if (wanted.has('cover')) offers.push(...offersFrom(await client.grids(id), 'cover'))
			if (wanted.has('hero')) offers.push(...offersFrom(await client.heroes(id), 'hero'))
			if (wanted.has('logo')) offers.push(...offersFrom(await client.logos(id), 'logo'))
			if (wanted.has('icon')) offers.push(...offersFrom(await client.icons(id), 'icon'))
			return offers
		}
	}
}
