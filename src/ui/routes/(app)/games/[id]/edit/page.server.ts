import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import type { PageContext } from '../../../../../context.server.ts'
import { errorMessage } from '../../../../../library-messages.ts'

export type EditView = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly error: string | null
}

export const loader: Loader<ParamsOf<'/games/[id]/edit'>, EditView, PageContext> = ({ params, search, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	return {
		id: game.id,
		name: game.name,
		platform: game.platform,
		error: errorMessage(new URLSearchParams(search).get('error'))
	}
}
