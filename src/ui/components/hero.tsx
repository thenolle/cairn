/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass } from '../format.ts'

export interface HeroGame {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly heroUrl: string | null
	readonly canLaunch: boolean
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
				<h1>{game.name}</h1>
				<p class="hero-meta">
					<span class="badge">{game.platform}</span>
					{game.favorite ? <span>In your favorites</span> : null}
				</p>
				<div class="hero-actions">
					{game.canLaunch ? (
						<form method="post" action={`/actions/games/${game.id}/launch`}>
							<button class="button button-primary" type="submit">
								Play
							</button>
						</form>
					) : null}
					<a class="button button-glass" href={`/games/${game.id}`}>
						Details
					</a>
				</div>
			</div>
		</section>
	)
}
