/** @jsxImportSource @gambrel/view */
import { Check, Plus } from '@gambrel/icons'
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
	const label = props.favorite ? `Remove ${props.name} from favorites` : `Add ${props.name} to favorites`
	return (
		<li class="game-card">
			<a class="game-link" href={`/games/${props.id}`}>
				<GameTile name={props.name} coverUrl={props.coverUrl} />
				<span class="game-name">{props.name}</span>
			</a>
			<div class="game-extra">
				<span class="game-meta">{props.platform}</span>
				<form method="post" action={`/actions/games/${props.id}/favorite`}>
					<input type="hidden" name="favorite" value={props.favorite ? '0' : '1'} />
					<button class="icon-button" type="submit" aria-label={label} title={label}>
						{props.favorite ? <Check size={16} /> : <Plus size={16} />}
					</button>
				</form>
			</div>
		</li>
	)
}
