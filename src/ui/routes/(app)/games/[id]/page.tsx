/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameTile } from '../../../../components/game-tile.tsx'
import { formatDate, formatPlaytime, hueClass } from '../../../../format.ts'
import type { loader } from './page.server.ts'

export default function GamePage(props: PageProps<ParamsOf<'/games/[id]'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	return (
		<div class="game-page">
			<section class={`hero hero-tall ${hueClass(game.name)}`} aria-label={game.name}>
				{game.heroUrl === null ? null : <img class="hero-art" src={game.heroUrl} alt="" decoding="async" />}
				<div class="hero-body hero-body-row">
					<div class="poster"><GameTile name={game.name} coverUrl={game.coverUrl} /></div>
					<div class="hero-text">
						<a class="back-link" href="/library">← Library</a>
						<h1>{game.name}</h1>
						<p class="hero-meta">
							<span class="badge">{game.platform}</span>
							<span>{game.source}</span>
							{game.favorite ? <span>Favorite</span> : null}
						</p>
						<div class="hero-actions">
							{game.canLaunch ? (<form method="post" action={`/actions/games/${game.id}/launch`}><button class="button button-primary" type="submit">Play</button></form>) : null}
							<form method="post" action={`/actions/games/${game.id}/favorite`}>
								<input type="hidden" name="favorite" value={game.favorite ? '0' : '1'} />
								<button class="button button-glass" type="submit">{game.favorite ? 'Remove from favorites' : 'Add to favorites'}</button>
							</form>
							<a class="button button-glass" href={`/games/${game.id}/artwork`}>Artwork</a>
							<a class="button button-glass" href={`/games/${game.id}/edit`}>Edit</a>
						</div>
					</div>
				</div>
			</section>
			<div class="page page-section">
				{game.notice === null ? null : (<p class={game.notice.ok ? 'notice' : 'notice notice-error'} role="status">{game.notice.message}</p>)}
				<dl class="facts">
					<div class="fact">
						<dt>Installation</dt>
						<dd>{game.installState}</dd>
					</div>
					<div class="fact">
						<dt>Last launched</dt>
						<dd>{game.lastPlayedAt === null ? 'Never' : formatDate(game.lastPlayedAt)}</dd>
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
				<section class="collections-panel" aria-labelledby="collections-title">
					<h2 id="collections-title">Collections</h2>
					{game.collections.length === 0 ? (<p class="muted">This game is not in any collection.</p>) : (<ul class="chip-list">
						{game.collections.map((collection) => (
							<li>
								<form method="post" action={`/actions/games/${game.id}/collections/${collection.id}/remove`}>
									<button class="chip" type="submit" aria-label={`Remove from ${collection.name}`}>
										{collection.name}
										<span aria-hidden="true"> ×</span>
									</button>
								</form>
							</li>
						))}
					</ul>)}
					{game.otherCollections.length === 0 ? (<p class="muted"><a href="/collections">Manage collections</a></p>) : (<form class="folder-form" method="post" action={`/actions/games/${game.id}/collections`}>
						<label class="field">
							<span class="field-label">Add to a collection</span>
							<select name="collection">{game.otherCollections.map((collection) => (<option value={collection.id}>{collection.name}</option>))}</select>
						</label>
						<button class="button button-secondary" type="submit">Add</button>
					</form>)}
				</section>
				<details class="danger-zone">
					<summary>Remove from library</summary>
					<p class="muted">This removes the entry from Cairn. Game files on disk are not touched.</p>
					<form method="post" action={`/actions/games/${game.id}/delete`}><button class="button button-danger" type="submit">Remove game</button></form>
				</details>
			</div>
		</div>
	)
}
