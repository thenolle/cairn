/** @jsxImportSource @gambrel/view */
import { Plus } from '@gambrel/icons'
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { platforms } from '../../../../shared/library.ts'
import { CheckboxField, SelectField, TextField } from '../../../components/fields.tsx'
import { GameCard } from '../../../components/game-card.tsx'
import type { loader } from './page.server.ts'

const platformOptions = [{ value: '', label: 'All platforms' }, ...platforms.map((platform) => ({ value: platform.key, label: platform.label }))]
const sortOptions = [
	{ value: 'name', label: 'Name' },
	{ value: 'added', label: 'Recently added' }
]

export default function LibraryPage(props: PageProps<ParamsOf<'/library'>, LoaderData<typeof loader>>): Child {
	const view = props.data
	const count = view.total === 1 ? '1 game' : `${view.total} games`

	return (
		<div class="page">
			<header class="page-header page-header-row">
				<div>
					<h1>{view.title}</h1>
					{view.isEmpty ? null : <p class="muted">{count}</p>}
				</div>
				<a class="button button-primary" href="/games/new">
					<Plus size={18} />
					<span>Add game</span>
				</a>
			</header>

			{view.isEmpty ? (
				<section class="empty-state" aria-labelledby="empty-title">
					<h2 id="empty-title">Your library is empty</h2>
					<p class="muted">Add a game by hand. Games from launchers and emulators will join them once those integrations are set up.</p>
					<a class="button button-primary" href="/games/new">
						Add your first game
					</a>
				</section>
			) : (
				<div class="page-section">
					<form class="toolbar" method="get" action="/library" role="search">
						<TextField name="q" label="Search" type="search" value={view.filters.text} required={false} maxLength="100" />
						<SelectField name="platform" label="Platform" options={platformOptions} value={view.filters.platform} />
						<SelectField name="collection" label="Collection" options={view.collectionOptions} value={view.filters.collection} />
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
							<a class="button button-secondary" href="/library">
								Clear filters
							</a>
						</section>
					) : (
						<ul class="game-grid">
							{view.games.map((game) => (
								<GameCard id={game.id} name={game.name} platform={game.platform} favorite={game.favorite} coverUrl={game.coverUrl} />
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
