import type { Loader, RouteParams } from '@gambrel/router'
import type { PinnedGame } from '../../components/app-shell.tsx'
import type { PageContext } from '../../context.server.ts'

export type ShellView = {
	readonly pathname: string
	readonly pinned: readonly PinnedGame[]
}

export const loader: Loader<RouteParams, ShellView, PageContext> = ({ pathname, context }) => {
	const favorites = context.library.list({
		text: '',
		platform: null,
		favoritesOnly: true,
		sort: 'name',
		cursor: null,
		limit: 6
	}).games
	const urls = context.artwork.urlsFor(favorites.map((game) => game.id))
	return {
		pathname: pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname,
		pinned: favorites.map((game) => ({ id: game.id, name: game.name, coverUrl: urls.get(game.id)?.cover ?? null }))
	}
}
