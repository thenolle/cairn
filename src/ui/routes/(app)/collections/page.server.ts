import type { Loader, ParamsOf } from '@gambrel/router'
import { collectionErrorMessages, isCollectionError } from '../../../../shared/collections.ts'
import type { PageContext } from '../../../context.server.ts'

export type MosaicGame = {
	readonly name: string
	readonly coverUrl: string | null
	readonly heroUrl: string | null
}

export type CollectionCard = {
	readonly id: string
	readonly name: string
	readonly gameCount: number
	readonly games: readonly MosaicGame[]
}

export type CollectionsView = {
	readonly collections: readonly CollectionCard[]
	readonly error: string | null
}

export const loader: Loader<ParamsOf<'/collections'>, CollectionsView, PageContext> = ({ search, context }) => {
	const code = new URLSearchParams(search).get('error')
	return {
		collections: context.collections.list().map((collection) => {
			const games = context.library.list({ text: '', platform: null, favoritesOnly: false, sort: 'name', cursor: null, limit: 4, collectionId: collection.id }).games
			const art = context.artwork.urlsFor(games.map((game) => game.id))
			return { id: collection.id, name: collection.name, gameCount: collection.gameCount, games: games.map((game) => ({ name: game.name, coverUrl: art.get(game.id)?.cover ?? null, heroUrl: art.get(game.id)?.hero ?? null })) }
		}),
		error: code !== null && isCollectionError(code) ? collectionErrorMessages[code] : null
	}
}
