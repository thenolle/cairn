/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameForm } from '../../../../components/game-form.tsx'
import type { loader } from './page.server.ts'

export default function NewGamePage(props: PageProps<ParamsOf<'/games/new'>, LoaderData<typeof loader>>): Child {
	return (
		<div class="page">
			<header class="page-header">
				<h1>Add a game</h1>
				<p class="muted">Add a game that Cairn has not found on its own.</p>
			</header>
			<GameForm action="/actions/games" submitLabel="Add game" cancelHref="/" name="" platform="pc" error={props.data.error} />
		</div>
	)
}
