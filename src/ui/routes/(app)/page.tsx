/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameCard } from '../../components/game-card.tsx'
import { Hero } from '../../components/hero.tsx'
import type { HomeGame, loader } from './page.server.ts'

function Row(props: { readonly id: string; readonly title: string; readonly href: string; readonly games: readonly HomeGame[] }): Child {
	return (
		<section aria-labelledby={props.id}>
			<div class="row-heading">
				<h2 id={props.id}>{props.title}</h2>
				<a class="muted" href={props.href}>
					See all
				</a>
			</div>
			<ul class="card-row">
				{props.games.map((game) => (
					<GameCard id={game.id} name={game.name} platform={game.platform} favorite={game.favorite} coverUrl={game.coverUrl} />
				))}
			</ul>
		</section>
	)
}

export default function HomePage(props: PageProps<ParamsOf<'/'>, LoaderData<typeof loader>>): Child {
	const view = props.data
	if (view.featured === null) {
		return (
			<div class="page">
				<header class="page-header">
					<h1>Welcome to Cairn</h1>
					<p class="muted">Your games, saves and platforms in one library that lives on your computer.</p>
				</header>
				<section class="empty-state" aria-labelledby="empty-title">
					<h2 id="empty-title">Your library is empty</h2>
					<p class="muted">Add a game by hand. Games from launchers and emulators will join them once those integrations are set up.</p>
					<a class="button button-primary" href="/games/new">
						Add your first game
					</a>
				</section>
			</div>
		)
	}
	return (
		<div class="home">
			<Hero game={view.featured} />
			<div class="page">
				{view.favorites.length === 0 ? null : <Row id="favorites-title" title="Favorites" href="/library?favorites=1" games={view.favorites} />}
				<Row id="recent-title" title="Recently added" href="/library?sort=added" games={view.recent} />
			</div>
		</div>
	)
}
