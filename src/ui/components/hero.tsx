/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { hueClass } from '../format.ts'

export interface HeroGame {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly heroUrl: string | null
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
				<p class="eyebrow">{game.favorite ? `Favorite · ${game.platform}` : game.platform}</p>
				<h1>{game.name}</h1>
				<div class="hero-actions">
					<a class="button button-primary" href={`/games/${game.id}`}>
						View game
					</a>
					<a class="button button-glass" href="/library">
						Browse library
					</a>
				</div>
			</div>
		</section>
	)
}
