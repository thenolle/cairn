import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import type { PageContext } from '../../../../../context.server.ts'
import { errorMessage } from '../../../../../library-messages.ts'

export type ArtworkView = {
	readonly id: string
	readonly name: string
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly error: string | null
}

export const loader: Loader<ParamsOf<'/games/[id]/artwork'>, ArtworkView, PageContext> = ({ params, search, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	const art = context.artwork.urlsOf(game.id)
	return {
		id: game.id,
		name: game.name,
		coverUrl: art.cover,
		heroUrl: art.hero,
		error: errorMessage(new URLSearchParams(search).get('error'))
	}
}
