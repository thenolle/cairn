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
}

export const loader: Loader<ParamsOf<'/games/[id]'>, GameDetails, PageContext> = ({ params, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	return {
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		source: game.source === 'manual' ? 'Added manually' : game.source,
		installState: installStateLabel(game.installState),
		favorite: game.favorite,
		playtimeSeconds: game.playtimeSeconds,
		createdAt: game.createdAt
	}
}
