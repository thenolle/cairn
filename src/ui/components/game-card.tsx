/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { GameTile } from './game-tile.tsx'

export interface GameCardProps {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
}

export function GameCard(props: GameCardProps): Child {
	return (
		<li class="game-card">
			<a href={`/games/${props.id}`}>
				<GameTile name={props.name} coverUrl={props.coverUrl} />
				<span class="game-name">{props.name}</span>
				<span class="game-meta muted">{props.favorite ? `${props.platform} · Favorite` : props.platform}</span>
			</a>
		</li>
	)
}
