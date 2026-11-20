/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { formatDate, formatPlaytime, initials } from '../../../../format.ts'
import type { loader } from './page.server.ts'

export default function GamePage(props: PageProps<ParamsOf<'/games/[id]'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	return (
		<div class="page">
			<a class="back-link muted" href="/">
				← Library
			</a>
			<header class="detail-header">
				<span class="game-tile detail-tile" aria-hidden="true">
					{initials(game.name)}
				</span>
				<div>
					<h1>{game.name}</h1>
					<p class="muted">{game.favorite ? `${game.platform} · Favorite` : game.platform}</p>
				</div>
			</header>

			<dl class="facts">
				<div class="fact">
					<dt>Source</dt>
					<dd>{game.source}</dd>
				</div>
				<div class="fact">
					<dt>Installation</dt>
					<dd>{game.installState}</dd>
				</div>
				<div class="fact">
					<dt>Playtime</dt>
					<dd>{formatPlaytime(game.playtimeSeconds)}</dd>
				</div>
				<div class="fact">
					<dt>Added</dt>
					<dd>{formatDate(game.createdAt)}</dd>
				</div>
			</dl>

			<div class="form-actions">
				<form method="post" action={`/actions/games/${game.id}/favorite`}>
					<input type="hidden" name="favorite" value={game.favorite ? '0' : '1'} />
					<button class="button button-secondary" type="submit">
						{game.favorite ? 'Remove from favorites' : 'Add to favorites'}
					</button>
				</form>
				<a class="button button-secondary" href={`/games/${game.id}/edit`}>
					Edit
				</a>
			</div>

			<details class="danger-zone">
				<summary>Remove from library</summary>
				<p class="muted">This removes the entry from Cairn. Game files on disk are not touched.</p>
				<form method="post" action={`/actions/games/${game.id}/delete`}>
					<button class="button button-danger" type="submit">
						Remove game
					</button>
				</form>
			</details>
		</div>
	)
}
