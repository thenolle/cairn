/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass } from '../format.ts'
import { InfoIcon, PlayIcon } from '../icons.ts'
import { LiveBadge } from './live-badge.tsx'

export interface HeroGame {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly heroUrl: string | null
	readonly canLaunch: boolean
	readonly blurb: string
	readonly live: boolean
}

export interface HeroProps {
	readonly game: HeroGame
}

export function Hero(props: HeroProps): Child {
	const game = props.game
	return (
		<section class={`hero ${hueClass(game.name)}`} aria-label="Featured game">
			{game.heroUrl === null ? null : <img class="hero-art" src={game.heroUrl} alt="" decoding="async" />}
			<div class="hero-body">
				<p class="hero-meta"><LiveBadge gameId={game.id} live={game.live} /></p>
				<h1>{game.name}</h1>
				<p class="hero-blurb">{game.blurb}</p>
				<div class="hero-actions">
					{game.canLaunch ? (
						<form method="post" action={`/actions/games/${game.id}/launch`}>
							<button class="button button-primary button-play" type="submit">
								<PlayIcon size={28} />
								<span>Play</span>
							</button>
						</form>
					) : null}
					<a class="button button-glass" href={`/games/${game.id}`}>
						<InfoIcon size={28} />
						<span>More Info</span>
					</a>
				</div>
			</div>
			<div class="hero-rating"><span>{game.platform}</span></div>
		</section>
	)
}
