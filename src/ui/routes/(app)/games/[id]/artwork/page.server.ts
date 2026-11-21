import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import type { ArtworkUrls } from '../../../../../../shared/artwork.ts'
import type { PageContext } from '../../../../../context.server.ts'
import { errorMessage } from '../../../../../library-messages.ts'

export type ArtworkView = {
	readonly id: string
	readonly name: string
	readonly art: ArtworkUrls
	readonly metadataAvailable: boolean
	readonly error: string | null
}

export const loader: Loader<ParamsOf<'/games/[id]/artwork'>, ArtworkView, PageContext> = ({ params, search, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	return {
		id: game.id,
		name: game.name,
		art: context.artwork.urlsOf(game.id),
		metadataAvailable: context.metadata.available(),
		error: errorMessage(new URLSearchParams(search).get('error'))
	}
}
