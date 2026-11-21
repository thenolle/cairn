import type { Loader, ParamsOf } from '@gambrel/router'
import { isPlatformKey, platformLabel, platforms } from '../../../../shared/library.ts'
import type { GameFilter, GameSort } from '../../../../shared/library.ts'
import type { PageContext } from '../../../context.server.ts'
import { formatPlaytime } from '../../../format.ts'

export type GameCardView = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly logoUrl: string | null
	readonly canLaunch: boolean
	readonly installed: boolean
	readonly detail: string
}

export type Pill = { readonly label: string; readonly href: string; readonly active: boolean }

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
	readonly pills: readonly Pill[]
	readonly collectionOptions: readonly { readonly value: string; readonly label: string }[]
	readonly nextHref: string | null
}

function hrefWith(params: URLSearchParams, changes: Readonly<Record<string, string | null>>): string {
	const next = new URLSearchParams(params)
	next.delete('after')
	for (const [key, value] of Object.entries(changes)) {
		if (value === null) next.delete(key)
		else next.set(key, value)
	}
	const text = next.toString()
	return text === '' ? '/library' : `/library?${text}`
}

export const loader: Loader<ParamsOf<'/library'>, LibraryView, PageContext> = ({ search, context }) => {
	const params = new URLSearchParams(search)
	const sort: GameSort = params.get('sort') === 'added' ? 'added' : 'name'
	const platformParam = params.get('platform')
	const platform = platformParam !== null && isPlatformKey(platformParam) ? platformParam : null
	const collectionParam = params.get('collection')
	const selected = collectionParam === null ? undefined : context.collections.get(collectionParam)
	const filter: GameFilter = { text: (params.get('q') ?? '').slice(0, 100), platform, favoritesOnly: params.get('favorites') === '1', collectionId: selected?.id ?? null }
	const page = context.library.list({ ...filter, sort, cursor: params.get('after') })
	const urls = context.artwork.urlsFor(page.games.map((game) => game.id))
	const total = context.library.count(filter)
	const filtered = filter.text !== '' || platform !== null || filter.favoritesOnly || selected !== undefined
	let nextHref: string | null = null
	if (page.nextCursor !== null) {
		const more = new URLSearchParams(params)
		more.set('after', page.nextCursor)
		nextHref = `/library?${more.toString()}`
	}
	return {
		title: selected?.name ?? (filter.favoritesOnly ? 'My List' : sort === 'added' ? 'Recently Added' : 'Library'),
		games: page.games.map((game) => ({
			id: game.id,
			name: game.name,
			platform: platformLabel(game.platform),
			favorite: game.favorite,
			coverUrl: urls.get(game.id)?.cover ?? null,
			heroUrl: urls.get(game.id)?.hero ?? null,
			logoUrl: urls.get(game.id)?.logo ?? null,
			canLaunch: context.launcher.canLaunch(game.source) && game.installState === 'installed',
			installed: game.installState === 'installed',
			detail: game.playtimeSeconds === 0 ? 'Not played yet' : `${formatPlaytime(game.playtimeSeconds)} played`
		})),
		total,
		isEmpty: total === 0 && !filtered,
		filters: { text: filter.text, platform: platform ?? '', collection: selected?.id ?? '', favoritesOnly: filter.favoritesOnly, sort },
		pills: [
			{ label: 'All', href: hrefWith(params, { platform: null }), active: platform === null },
			...platforms.map((entry) => ({ label: entry.label, href: hrefWith(params, { platform: entry.key }), active: platform === entry.key }))
		],
		collectionOptions: [
			{ value: '', label: 'All collections' },
			...context.collections.list().map((collection) => ({ value: collection.id, label: collection.name }))
		],
		nextHref
	}
}
