import type { Loader, RouteParams } from '@gambrel/router'
import type { PageContext } from '../../context.server.ts'

export const loader: Loader<RouteParams, { pathname: string }, PageContext> = ({ pathname }) => ({
	pathname: pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
})
