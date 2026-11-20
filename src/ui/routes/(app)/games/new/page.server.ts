import type { Loader, ParamsOf } from '@gambrel/router'
import type { PageContext } from '../../../../context.server.ts'
import { errorMessage } from '../../../../library-messages.ts'

export const loader: Loader<ParamsOf<'/games/new'>, { error: string | null }, PageContext> = ({ search }) => ({
	error: errorMessage(new URLSearchParams(search).get('error'))
})
