/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons.ts'
import { GameCard } from './game-card.tsx'
import type { GameCardProps } from './game-card.tsx'

export interface GameRowProps {
	readonly id: string
	readonly title: string
	readonly href: string | null
	readonly games: readonly GameCardProps[]
}

/** A titled, horizontally scrolling row of games. Scrolling works without script; the arrows are an enhancement. */
export function GameRow(props: GameRowProps): Child {
	const listId = `${props.id}-list`
	return (
		<section class="row" data-row aria-labelledby={`${props.id}-title`}>
			<div class="row-heading">
				<h2 id={`${props.id}-title`}>{props.title}</h2>
				{props.href === null ? null : (
					<a class="row-more" href={props.href}>
						See all
					</a>
				)}
			</div>
			<div class="row-viewport">
				<button class="row-arrow row-arrow-previous" type="button" data-row-previous aria-controls={listId} aria-label={`Scroll ${props.title} back`}>
					<ChevronLeftIcon size={28} />
				</button>
				<ul class="row-list" id={listId} data-row-list>
					{props.games.map((game) => (
						<GameCard id={game.id} name={game.name} platform={game.platform} favorite={game.favorite} coverUrl={game.coverUrl} />
					))}
				</ul>
				<button class="row-arrow row-arrow-next" type="button" data-row-next aria-controls={listId} aria-label={`Scroll ${props.title} forward`}>
					<ChevronRightIcon size={28} />
				</button>
			</div>
		</section>
	)
}
