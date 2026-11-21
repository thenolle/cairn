import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import { installStateLabel, platformLabel, sourceLabel } from '../../../../../shared/library.ts'
import type { PageContext } from '../../../../context.server.ts'

export type CollectionRef = {
	readonly id: string
	readonly name: string
}

export type GameDetails = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly source: string
	readonly installState: string
	readonly favorite: boolean
	readonly playtimeSeconds: number
	readonly createdAt: number
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly collections: readonly CollectionRef[]
	readonly otherCollections: readonly CollectionRef[]
}

export const loader: Loader<ParamsOf<'/games/[id]'>, GameDetails, PageContext> = ({ params, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	const art = context.artwork.urlsOf(game.id)
	const member = context.collections.forGame(game.id)
	const memberIds = new Set(member.map((collection) => collection.id))
	return {
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		source: sourceLabel(game.source),
		installState: installStateLabel(game.installState),
		favorite: game.favorite,
		playtimeSeconds: game.playtimeSeconds,
		createdAt: game.createdAt,
		coverUrl: art.cover,
		heroUrl: art.hero,
		collections: member.map((collection) => ({ id: collection.id, name: collection.name })),
		otherCollections: context.collections
			.list()
			.filter((collection) => !memberIds.has(collection.id))
			.map((collection) => ({ id: collection.id, name: collection.name }))
	}
}
