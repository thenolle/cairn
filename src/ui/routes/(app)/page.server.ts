import type { Loader, ParamsOf } from '@gambrel/router'
import { isPlatformKey, platformLabel } from '../../../shared/library.ts'
import type { GameFilter, GameSort } from '../../../shared/library.ts'
import type { PageContext } from '../../context.server.ts'

export type GameCard = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
}

export type LibraryView = {
	readonly games: readonly GameCard[]
	readonly total: number
	readonly isEmpty: boolean
	readonly filters: {
		readonly text: string
		readonly platform: string
		readonly favoritesOnly: boolean
		readonly sort: GameSort
	}
	readonly nextHref: string | null
}

export const loader: Loader<ParamsOf<'/'>, LibraryView, PageContext> = ({ search, context }) => {
	const params = new URLSearchParams(search)
	const sort: GameSort = params.get('sort') === 'added' ? 'added' : 'name'
	const platform = params.get('platform')
	const filter: GameFilter = {
		text: (params.get('q') ?? '').slice(0, 100),
		platform: platform !== null && isPlatformKey(platform) ? platform : null,
		favoritesOnly: params.get('favorites') === '1'
	}

	const page = context.library.list({ ...filter, sort, cursor: params.get('after') })
	const total = context.library.count(filter)
	const filtered = filter.text !== '' || filter.platform !== null || filter.favoritesOnly

	let nextHref: string | null = null
	if (page.nextCursor !== null) {
		params.set('after', page.nextCursor)
		nextHref = `/?${params.toString()}`
	}

	return {
		games: page.games.map((game) => ({
			id: game.id,
			name: game.name,
			platform: platformLabel(game.platform),
			favorite: game.favorite
		})),
		total,
		isEmpty: total === 0 && !filtered,
		filters: { text: filter.text, platform: filter.platform ?? '', favoritesOnly: filter.favoritesOnly, sort },
		nextHref
	}
}
