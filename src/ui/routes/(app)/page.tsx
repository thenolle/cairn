/** @jsxImportSource @gambrel/view */
import { Plus } from '@gambrel/icons'
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { platforms } from '../../../shared/library.ts'
import { CheckboxField, SelectField, TextField } from '../../components/fields.tsx'
import { initials } from '../../format.ts'
import type { loader } from './page.server.ts'

const platformOptions = [{ value: '', label: 'All platforms' }, ...platforms.map((platform) => ({ value: platform.key, label: platform.label }))]
const sortOptions = [
	{ value: 'name', label: 'Name' },
	{ value: 'added', label: 'Recently added' }
]

export default function LibraryPage(props: PageProps<ParamsOf<'/'>, LoaderData<typeof loader>>): Child {
	const view = props.data
	const count = view.total === 1 ? '1 game' : `${view.total} games`

	return (
		<div class="page">
			<header class="page-header page-header-row">
				<div>
					<h1>Library</h1>
					{view.isEmpty ? null : <p class="muted">{count}</p>}
				</div>
				<a class="button" href="/games/new">
					<Plus size={18} />
					<span>Add game</span>
				</a>
			</header>

			{view.isEmpty ? (
				<section class="empty-state" aria-labelledby="empty-title">
					<h2 id="empty-title">Your library is empty</h2>
					<p class="muted">Add a game by hand. Games from launchers and emulators will join them once those integrations are set up.</p>
					<a class="button" href="/games/new">
						Add your first game
					</a>
				</section>
			) : (
				<div class="page">
					<form class="toolbar" method="get" action="/" role="search">
						<TextField name="q" label="Search" type="search" value={view.filters.text} required={false} maxLength="100" />
						<SelectField name="platform" label="Platform" options={platformOptions} value={view.filters.platform} />
						<SelectField name="sort" label="Sort by" options={sortOptions} value={view.filters.sort} />
						<CheckboxField name="favorites" label="Favorites only" value="1" checked={view.filters.favoritesOnly} />
						<button class="button button-secondary" type="submit">
							Apply
						</button>
					</form>

					{view.games.length === 0 ? (
						<section class="empty-state" aria-labelledby="none-title">
							<h2 id="none-title">No games match</h2>
							<p class="muted">Try different words or remove a filter.</p>
							<a class="button button-secondary" href="/">
								Clear filters
							</a>
						</section>
					) : (
						<ul class="game-grid">
							{view.games.map((game) => (
								<li class="game-card">
									<a href={`/games/${game.id}`}>
										<span class="game-tile" aria-hidden="true">
											{initials(game.name)}
										</span>
										<span class="game-name">{game.name}</span>
										<span class="game-meta muted">{game.favorite ? `${game.platform} · Favorite` : game.platform}</span>
									</a>
								</li>
							))}
						</ul>
					)}

					{view.nextHref === null ? null : (
						<a class="button button-secondary load-more" href={view.nextHref}>
							Show more
						</a>
					)}
				</div>
			)}
		</div>
	)
}
