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

const base = { text: '', cursor: null, limit: 12 } as const

export const loader: Loader<ParamsOf<'/'>, HomeView, PageContext> = ({ context }) => {
	const { library, artwork } = context
	const groups: { id: string; title: string; href: string; games: readonly Game[] }[] = [
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
		...platforms.map((platform) => ({
			id: `platform-${platform.key}`,
			title: platform.key === 'other' ? 'Other games' : `On ${platform.label}`,
			href: `/library?platform=${platform.key}`,
			games: library.list({ ...base, platform: platform.key, favoritesOnly: false, sort: 'name' }).games
		}))
	].filter((group) => group.games.length > 0)

	const urls = artwork.urlsFor(groups.flatMap((group) => group.games.map((game) => game.id)))
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
