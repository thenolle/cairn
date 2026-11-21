import type { Loader, ParamsOf } from '@gambrel/router'
import { isPlatformKey, platformLabel } from '../../../../shared/library.ts'
import type { GameFilter, GameSort } from '../../../../shared/library.ts'
import type { PageContext } from '../../../context.server.ts'

export type GameCardView = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
}

export type LibraryView = {
	readonly title: string
	readonly games: readonly GameCardView[]
	readonly total: number
	readonly isEmpty: boolean
	readonly filters: {
		readonly text: string
		readonly platform: string
		readonly collection: string
		readonly favoritesOnly: boolean
		readonly sort: GameSort
	}
	readonly collectionOptions: readonly { readonly value: string; readonly label: string }[]
	readonly nextHref: string | null
}

export const loader: Loader<ParamsOf<'/library'>, LibraryView, PageContext> = ({ search, context }) => {
	const params = new URLSearchParams(search)
	const sort: GameSort = params.get('sort') === 'added' ? 'added' : 'name'
	const platform = params.get('platform')
	const collectionParam = params.get('collection')
	const selected = collectionParam === null ? undefined : context.collections.get(collectionParam)
	const filter: GameFilter = {
		text: (params.get('q') ?? '').slice(0, 100),
		platform: platform !== null && isPlatformKey(platform) ? platform : null,
		favoritesOnly: params.get('favorites') === '1',
		collectionId: selected?.id ?? null
	}

	const page = context.library.list({ ...filter, sort, cursor: params.get('after') })
	const urls = context.artwork.urlsFor(page.games.map((game) => game.id))
	const total = context.library.count(filter)
	const filtered = filter.text !== '' || filter.platform !== null || filter.favoritesOnly || selected !== undefined

	let nextHref: string | null = null
	if (page.nextCursor !== null) {
		params.set('after', page.nextCursor)
		nextHref = `/library?${params.toString()}`
	}

	return {
		title: selected?.name ?? 'Library',
		games: page.games.map((game) => ({
			id: game.id,
			name: game.name,
			platform: platformLabel(game.platform),
			favorite: game.favorite,
			coverUrl: urls.get(game.id)?.cover ?? null
		})),
		total,
		isEmpty: total === 0 && !filtered,
		filters: {
			text: filter.text,
			platform: filter.platform ?? '',
			collection: selected?.id ?? '',
			favoritesOnly: filter.favoritesOnly,
			sort
		},
		collectionOptions: [
			{ value: '', label: 'All collections' },
			...context.collections.list().map((collection) => ({ value: collection.id, label: collection.name }))
		],
		nextHref
	}
}
