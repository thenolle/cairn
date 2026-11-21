/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameRow } from '../../components/game-row.tsx'
import { Hero } from '../../components/hero.tsx'
import type { loader } from './page.server.ts'

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
					<a class="button button-primary" href="/games/new">Add your first game</a>
				</section>
			</div>
		)
	}
	return (
		<div class="home">
			<Hero game={view.featured} />
			<div class="rows">{view.rows.map((row) => (<GameRow id={row.id} title={row.title} href={row.href} games={row.games} ranked={row.ranked} />))}</div>
		</div>
	)
}
