import type { Loader, ParamsOf } from '@gambrel/router'
import { platformLabel, platforms } from '../../../shared/library.ts'
import type { Game } from '../../../shared/library.ts'
import type { PageContext } from '../../context.server.ts'

export type HomeGame = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
	readonly heroUrl: string | null
}

export type HomeRow = {
	readonly id: string
	readonly title: string
	readonly href: string
	readonly games: readonly HomeGame[]
}

export type HomeView = {
	readonly featured: HomeGame | null
	readonly rows: readonly HomeRow[]
}

type Group = { readonly id: string; readonly title: string; readonly href: string; readonly games: readonly Game[] }

const base = { text: '', cursor: null, limit: 12 } as const
const maxCollectionRows = 6
const artworkBatch = 100

export const loader: Loader<ParamsOf<'/'>, HomeView, PageContext> = ({ context }) => {
	const { library, artwork, collections } = context

	const collectionGroups: Group[] = collections
		.list()
		.filter((collection) => collection.gameCount > 0)
		.slice(0, maxCollectionRows)
		.map((collection) => ({
			id: `collection-${collection.id}`,
			title: collection.name,
			href: `/library?collection=${collection.id}`,
			games: library.list({ ...base, platform: null, favoritesOnly: false, sort: 'name', collectionId: collection.id }).games
		}))

	const groups: Group[] = [
		{
			id: 'favorites',
			title: 'Favorites',
			href: '/library?favorites=1',
			games: library.list({ ...base, platform: null, favoritesOnly: true, sort: 'name' }).games
		},
		{
			id: 'recent',
			title: 'Recently added',
			href: '/library?sort=added',
			games: library.list({ ...base, platform: null, favoritesOnly: false, sort: 'added' }).games
		},
		...collectionGroups,
		...platforms.map((platform) => ({
			id: `platform-${platform.key}`,
			title: platform.key === 'other' ? 'Other games' : `On ${platform.label}`,
			href: `/library?platform=${platform.key}`,
			games: library.list({ ...base, platform: platform.key, favoritesOnly: false, sort: 'name' }).games
		}))
	].filter((group) => group.games.length > 0)

	const ids = [...new Set(groups.flatMap((group) => group.games.map((game) => game.id)))]
	const urls = new Map<string, { cover: string | null; hero: string | null }>()
	for (let start = 0; start < ids.length; start += artworkBatch) {
		for (const [id, art] of artwork.urlsFor(ids.slice(start, start + artworkBatch))) urls.set(id, art)
	}

	const toHome = (game: Game): HomeGame => ({
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		favorite: game.favorite,
		coverUrl: urls.get(game.id)?.cover ?? null,
		heroUrl: urls.get(game.id)?.hero ?? null
	})

	const rows = groups.map((group) => ({ id: group.id, title: group.title, href: group.href, games: group.games.map(toHome) }))
	const all = rows.flatMap((row) => row.games)
	const featured = all.find((game) => game.heroUrl !== null) ?? all[0] ?? null
	return { featured, rows }
}
