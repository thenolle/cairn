import { maxArtworkBytes } from '../../../shared/artwork.ts'
import { downloadImage } from '../image-download.ts'
import type { IgdbClient } from '../igdb-client.ts'
import { pickByName } from '../matching.ts'
import type { ArtworkOffer, ArtworkProvider } from '../provider.ts'
import type { Fetcher } from '../steamgriddb-client.ts'

const isIgdbHost = (hostname: string): boolean => hostname === 'images.igdb.com'

export interface IgdbProviderOptions {
	readonly client: IgdbClient | null
	readonly fetcher?: Fetcher
}

/** Covers and wide artwork from IGDB. It knows games on every platform, including ones that have no store. */
export function createIgdbProvider(options: IgdbProviderOptions): ArtworkProvider {
	const { client } = options
	const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
	const picture = (size: string, id: string): (() => Promise<Uint8Array | null>) => () => downloadImage(`https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`, maxArtworkBytes, fetcher, isIgdbHost)
	return {
		id: 'igdb',
		name: 'IGDB',
		hint: 'Set CAIRN_IGDB_CLIENT_ID and CAIRN_IGDB_CLIENT_SECRET from a free Twitch developer application.',
		ready: () => client !== null,
		async find(game, wanted): Promise<readonly ArtworkOffer[]> {
			if (client === null) return []
			const match = pickByName(await client.search(game.name), game.name)
			if (match === null) return []
			const offers: ArtworkOffer[] = []
			if (wanted.has('cover') && match.coverId !== null) offers.push({ kind: 'cover', score: 50, load: picture('cover_big_2x', match.coverId) })
			if (wanted.has('hero')) {
				const ids = match.artworkIds.length > 0 ? match.artworkIds : match.screenshotIds
				ids.slice(0, 3).forEach((id, index) => offers.push({ kind: 'hero', score: 60 - index, load: picture('1080p', id) }))
			}
			return offers
		}
	}
}
