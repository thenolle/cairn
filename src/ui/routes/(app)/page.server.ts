import type { Loader, ParamsOf } from '@gambrel/router'
import type { Game } from '../../../shared/library.ts'
import { platformLabel } from '../../../shared/library.ts'
import type { PageContext } from '../../context.server.ts'

export type HomeGame = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
	readonly heroUrl: string | null
}

export type HomeView = {
	readonly featured: HomeGame | null
	readonly favorites: readonly HomeGame[]
	readonly recent: readonly HomeGame[]
}

const base = { text: '', platform: null, cursor: null, limit: 12 } as const

export const loader: Loader<ParamsOf<'/'>, HomeView, PageContext> = ({ context }) => {
	const { library, artwork } = context
	const favorites = library.list({ ...base, favoritesOnly: true, sort: 'name' }).games
	const recent = library.list({ ...base, favoritesOnly: false, sort: 'added' }).games
	const urls = artwork.urlsFor([...favorites, ...recent].map((game) => game.id))

	const toHome = (game: Game): HomeGame => ({
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		favorite: game.favorite,
		coverUrl: urls.get(game.id)?.cover ?? null,
		heroUrl: urls.get(game.id)?.hero ?? null
	})

	const favoriteViews = favorites.map(toHome)
	const recentViews = recent.map(toHome)
	const featured =
		[...favoriteViews, ...recentViews].find((game) => game.heroUrl !== null) ?? favoriteViews[0] ?? recentViews[0] ?? null
	return { featured, favorites: favoriteViews, recent: recentViews }
}
