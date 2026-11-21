/** @jsxImportSource @gambrel/view */
import { Check, Plus } from '@gambrel/icons'
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameThumb } from '../../../../components/game-thumb.tsx'
import { LiveBadge } from '../../../../components/live-badge.tsx'
import { formatDate, formatPlaytime, hueClass } from '../../../../format.ts'
import { PlayIcon } from '../../../../icons.ts'
import type { loader } from './page.server.ts'

export default function GamePage(props: PageProps<ParamsOf<'/games/[id]'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	const favoriteLabel = game.favorite ? 'Remove from favorites' : 'Add to favorites'
	return (
		<div class="game-page" data-game-page={game.id}>
			<a class="modal-close" href="/library" aria-label="Close">×</a>
			<section class={`hero ${hueClass(game.name)}`} aria-label={game.name}>
				{game.heroUrl === null ? null : <img class="hero-art" src={game.heroUrl} alt="" decoding="async" />}
				<div class="hero-body">
					<h1>{game.name}</h1>
					<div class="hero-actions">
						{game.canLaunch ? (<form method="post" action={`/actions/games/${game.id}/launch`}><button class="button button-primary button-play" type="submit"><PlayIcon size={26} /> <span>Play</span></button></form>) : null}
						<form method="post" action={`/actions/games/${game.id}/favorite`}>
							<input type="hidden" name="favorite" value={game.favorite ? '0' : '1'} />
							<button class="round round-lg" type="submit" aria-label={favoriteLabel} title={favoriteLabel}>{game.favorite ? <Check size={22} /> : <Plus size={22} />}</button>
						</form>
					</div>
				</div>
			</section>
			<div class="detail">
				<div class="detail-main">
					{game.notice === null ? null : (<p class={game.notice.ok ? 'notice' : 'notice notice-error'} role="status">{game.notice.message}</p>)}
					<p class="detail-meta">
						<LiveBadge gameId={game.id} live={game.activeSince !== null} />
						<span class={game.installed ? 'meta-good' : 'meta-dim'}>{game.installState}</span>
						<span class="meta-box">{game.platform}</span>
						<span>{game.playtimeSeconds === 0 ? 'Not played yet' : `${formatPlaytime(game.playtimeSeconds)} played`}</span>
					</p>
					<dl class="detail-facts">
						<div>
							<dt>Last launched</dt>
							<dd>{game.lastPlayedAt === null ? 'Never' : formatDate(game.lastPlayedAt)}</dd>
						</div>
						<div>
							<dt>Added</dt>
							<dd>{formatDate(game.createdAt)}</dd>
						</div>
					</dl>
					{game.sessions.length === 0 ? null : (
						<section class="collections-panel" aria-labelledby="sessions-title">
							<h2 id="sessions-title">Recent sessions</h2>
							<ul class="session-list">
								{game.sessions.map((session) => (
									<li>
										<span>{formatDate(session.startedAt)}</span>
										<span class="muted">{formatPlaytime(session.seconds)}</span>
									</li>
								))}
							</ul>
						</section>
					)}
					<section class="collections-panel" aria-labelledby="collections-title">
						<h2 id="collections-title">Collections</h2>
						{game.collections.length === 0 ? (<p class="muted">This game is not in any collection.</p>) : (<ul class="chip-list">{game.collections.map((collection) => (<li><form method="post" action={`/actions/games/${game.id}/collections/${collection.id}/remove`}><button class="chip" type="submit" aria-label={`Remove from ${collection.name}`}>{collection.name}<span aria-hidden="true"> ×</span></button></form></li>))}</ul>)}
						{game.otherCollections.length === 0 ? (<p class="muted"><a href="/collections">Manage collections</a></p>) : (<form class="folder-form" method="post" action={`/actions/games/${game.id}/collections`}>
							<label class="field">
								<span class="field-label">Add to a collection</span>
								<select name="collection">{game.otherCollections.map((collection) => (<option value={collection.id}>{collection.name}</option>))}</select>
							</label>
							<button class="button button-secondary" type="submit">Add</button>
						</form>)}
					</section>
				</div>
				<div class="detail-side">
					<p><span class="dim">Platform:</span> {game.platform}</p>
					<p><span class="dim">Source:</span> {game.source}</p>
					<p><a href={`/games/${game.id}/artwork`}>Edit artwork</a></p>
					<p><a href={`/games/${game.id}/edit`}>Edit details</a></p>
				</div>
			</div>
			{game.similar.length === 0 ? null : (
				<section class="more" aria-labelledby="more-title">
					<h2 id="more-title">More like this</h2>
					<ul class="more-grid">
						{game.similar.map((peer) => (
							<li class="more-card">
								<a href={`/games/${peer.id}`}>
									<GameThumb name={peer.name} coverUrl={peer.coverUrl} heroUrl={peer.heroUrl} portrait={false} />
									<span class="more-title">{peer.name}</span>
									<span class="more-meta">{peer.platform}</span>
								</a>
							</li>
						))}
					</ul>
				</section>
			)}
			<section class="about" aria-labelledby="about-title">
				<h2 id="about-title">About {game.name}</h2>
				<details class="danger-zone">
					<summary>Remove from library</summary>
					<p class="muted">This removes the entry from Cairn. Game files on disk are not touched.</p>
					<form method="post" action={`/actions/games/${game.id}/delete`}><button class="button button-danger" type="submit">Remove game</button></form>
				</details>
			</section>
		</div>
	)
}
