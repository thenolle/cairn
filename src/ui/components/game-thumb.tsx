/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass } from '../format.ts'

export interface GameThumbProps {
	readonly name: string
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly portrait: boolean
}

/** A game's picture: banner art in landscape, cover art in portrait, or a tinted tile with the title. */
export function GameThumb(props: GameThumbProps): Child {
	const classes = `game-thumb ${props.portrait ? 'game-thumb-portrait ' : ''}${hueClass(props.name)}`
	const image = props.portrait ? props.coverUrl : (props.heroUrl ?? props.coverUrl)
	return image === null ? (
		<span class={classes} aria-hidden="true"><span class="game-thumb-title">{props.name}</span></span>
	) : (
		<span class={classes} aria-hidden="true"><img src={image} alt="" loading="lazy" decoding="async" width={props.portrait ? '300' : '320'} height={props.portrait ? '400' : '180'} /></span>
	)
}
