import { maxArtworkBytes } from '../../../shared/artwork.ts'
import type { ArtworkKind } from '../../../shared/artwork.ts'
import { downloadImage } from '../image-download.ts'
import type { ArtworkOffer, ArtworkProvider } from '../provider.ts'
import type { Fetcher } from '../steamgriddb-client.ts'

const hosts: ReadonlyArray<{ readonly host: string; readonly prefix: string }> = [
	{ host: 'cdn.cloudflare.steamstatic.com', prefix: '/steam/apps' },
	{ host: 'shared.fastly.steamstatic.com', prefix: '/store_item_assets/steam/apps' },
	{ host: 'steamcdn-a.akamaihd.net', prefix: '/steam/apps' }
]

const files: ReadonlyArray<readonly [kind: ArtworkKind, file: string, score: number]> = [
	['cover', 'library_600x900_2x.jpg', 90],
	['cover', 'library_600x900.jpg', 60],
	['hero', 'library_hero.jpg', 90],
	['hero', 'header.jpg', 30],
	['logo', 'logo.png', 80]
]

const isSteamHost = (hostname: string): boolean => hosts.some((entry) => entry.host === hostname)

export interface SteamCdnOptions {
	readonly fetcher?: Fetcher
}

/** Steam's public store images, found by app id. No key is needed. Some games have none. */
export function createSteamCdnProvider(options: SteamCdnOptions = {}): ArtworkProvider {
	const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init))
	return {
		id: 'steam-cdn',
		name: 'Steam store images',
		hint: 'Uses Steam’s public image servers.',
		ready: () => true,
		async find(game, wanted): Promise<readonly ArtworkOffer[]> {
			const appId = game.sourceId
			if (game.source !== 'steam' || appId === null || !/^\d{1,10}$/u.test(appId)) return []
			return files.filter(([kind]) => wanted.has(kind)).map(([kind, file, score]) => ({
				kind,
				score,
				load: async (): Promise<Uint8Array | null> => {
					for (const { host, prefix } of hosts) {
						const bytes = await downloadImage(`https://${host}${prefix}/${appId}/${file}`, maxArtworkBytes, fetcher, isSteamHost)
						if (bytes !== null) return bytes
					}
					return null
				}
			}))
		}
	}
}
