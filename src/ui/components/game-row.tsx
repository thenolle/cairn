/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons.ts'
import { GameCard } from './game-card.tsx'
import type { GameCardProps } from './game-card.tsx'

export interface GameRowProps {
	readonly id: string
	readonly title: string
	readonly href: string | null
	readonly games: readonly Omit<GameCardProps, 'rank'>[]
	readonly ranked: boolean
}

/** A titled, horizontally scrolling row of games. Scrolling works without script; the arrows are an enhancement. */
export function GameRow(props: GameRowProps): Child {
	const listId = `${props.id}-list`
	return (
		<section class={props.ranked ? 'row row-ranked' : 'row'} data-row aria-labelledby={`${props.id}-title`}>
			<div class="row-heading">
				<h2 id={`${props.id}-title`}>{props.title}</h2>
				{props.href === null ? null : (<a class="row-more" href={props.href}>Explore all ›</a>)}
			</div>
			<div class="row-viewport">
				<button class="row-arrow row-arrow-previous" type="button" data-row-previous aria-controls={listId} aria-label={`Scroll ${props.title} back`}><ChevronLeftIcon size={28} /></button>
				<ul class="row-list" id={listId} data-row-list>
					{props.games.map((game, index) => (
						<GameCard
							id={game.id}
							name={game.name}
							platform={game.platform}
							favorite={game.favorite}
							coverUrl={game.coverUrl}
							heroUrl={game.heroUrl}
							logoUrl={game.logoUrl}
							canLaunch={game.canLaunch}
							installed={game.installed}
							detail={game.detail}
							rank={props.ranked ? index + 1 : undefined}
						/>
					))}
				</ul>
				<button class="row-arrow row-arrow-next" type="button" data-row-next aria-controls={listId} aria-label={`Scroll ${props.title} forward`}><ChevronRightIcon size={28} /></button>
			</div>
		</section>
	)
}
