/** @jsxImportSource @gambrel/view */
import { Check, Plus } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { ChevronDownIcon, PlayIcon } from '../icons.ts'
import { GameThumb } from './game-thumb.tsx'

export interface GameCardProps {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly favorite: boolean
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly canLaunch: boolean
	readonly installed: boolean
	readonly detail: string
	readonly rank?: number | undefined
}

export function GameCard(props: GameCardProps): Child {
	const ranked = props.rank !== undefined
	const favoriteLabel = props.favorite ? `Remove ${props.name} from favorites` : `Add ${props.name} to favorites`
	return (
		<li class={ranked ? 'game-card game-card-ranked' : 'game-card'} data-live-game={props.id}>
			{props.rank === undefined ? null : (<span class="rank" aria-hidden="true">{props.rank}</span>)}
			<div class="card-body">
				<a class="game-link" href={`/games/${props.id}`}>
					<GameThumb name={props.name} coverUrl={props.coverUrl} heroUrl={props.heroUrl} portrait={ranked} />
					<span class="visually-hidden">{props.name}</span>
				</a>
				<div class="game-extra">
					<div class="game-actions">
						{props.canLaunch ? (<form method="post" action={`/actions/games/${props.id}/launch`}><button class="round round-play" type="submit" aria-label={`Play ${props.name}`} title="Play"><PlayIcon size={16} /></button></form>) : null}
						<form method="post" action={`/actions/games/${props.id}/favorite`}>
							<input type="hidden" name="favorite" value={props.favorite ? '0' : '1'} />
							<button class="round" type="submit" aria-label={favoriteLabel} title={favoriteLabel}>{props.favorite ? <Check size={16} /> : <Plus size={16} />}</button>
						</form>
						<a class="round round-more" href={`/games/${props.id}`} aria-label={`More about ${props.name}`} title="More info"><ChevronDownIcon size={18} /></a>
					</div>
					<p class="game-title">{props.name}</p>
					<p class="game-meta">
						<span class={props.installed ? 'meta-good' : 'meta-dim'}>{props.installed ? 'Installed' : 'Not installed'}</span>
						<span class="meta-box">{props.platform}</span>
					</p>
					<p class="game-detail">{props.detail}</p>
				</div>
			</div>
		</li>
	)
}
