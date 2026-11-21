import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import { installStateLabel, platformLabel } from '../../../../../shared/library.ts'
import type { PageContext } from '../../../../context.server.ts'

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
}

export const loader: Loader<ParamsOf<'/games/[id]'>, GameDetails, PageContext> = ({ params, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	const art = context.artwork.urlsOf(game.id)
	return {
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		source: game.source === 'manual' ? 'Added manually' : game.source,
		installState: installStateLabel(game.installState),
		favorite: game.favorite,
		playtimeSeconds: game.playtimeSeconds,
		createdAt: game.createdAt,
		coverUrl: art.cover,
		heroUrl: art.hero
	}
}
