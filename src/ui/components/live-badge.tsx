/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export interface LiveBadgeProps {
	readonly gameId: string
	readonly live: boolean
}

/** Shows "Now playing" while the game runs. The server sets the initial state and the page keeps it current. */
export function LiveBadge(props: LiveBadgeProps): Child {
	return props.live ? (
		<span class="badge badge-live" data-live-game={props.gameId} data-live="">Now playing</span>
	) : (
		<span class="badge badge-live" data-live-game={props.gameId}>Now playing</span>
	)
}
