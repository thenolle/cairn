/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass, initials } from '../format.ts'

export interface GameTileProps {
	readonly name: string
	readonly coverUrl: string | null
}

/** A game's cover, or a tinted tile with its initials when no cover has been set. */
export function GameTile(props: GameTileProps): Child {
	const classes = `game-tile ${hueClass(props.name)}`
	return props.coverUrl === null ? (
		<span class={classes} aria-hidden="true">
			{initials(props.name)}
		</span>
	) : (
		<span class={classes} aria-hidden="true">
			<img src={props.coverUrl} alt="" loading="lazy" decoding="async" width="300" height="400" />
		</span>
	)
}
