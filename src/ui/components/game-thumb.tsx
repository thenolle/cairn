/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass, initials } from '../format.ts'

export interface GameThumbProps {
	readonly name: string
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly logoUrl: string | null
	readonly portrait: boolean
}

/** A game's picture: banner art with its logo in landscape, cover art in portrait, or a tinted tile with the title. */
export function GameThumb(props: GameThumbProps): Child {
	const image = props.portrait ? props.coverUrl : (props.heroUrl ?? props.coverUrl)
	const logo = props.portrait ? null : props.logoUrl
	const classes = ['game-thumb', props.portrait ? 'game-thumb-portrait' : '', image !== null && logo !== null ? 'game-thumb-with-logo' : '', hueClass(props.name)].filter((name) => name !== '').join(' ')
	if (image === null) {
		return (
			<span class={classes} aria-hidden="true">
				<span class="game-thumb-initial">{initials(props.name)}</span>
				{logo === null ? (<span class="game-thumb-title">{props.name}</span>) : (<img class="thumb-logo thumb-logo-center" src={logo} alt="" loading="lazy" decoding="async" />)}
			</span>
		)
	}
	return (
		<span class={classes} aria-hidden="true">
			<img src={image} alt="" loading="lazy" decoding="async" width={props.portrait ? '300' : '320'} height={props.portrait ? '400' : '180'} />
			{logo === null ? null : <img class="thumb-logo" src={logo} alt="" loading="lazy" decoding="async" />}
		</span>
	)
}
