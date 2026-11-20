/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { GameForm } from '../../../../../components/game-form.tsx'
import type { loader } from './page.server.ts'

export default function EditGamePage(props: PageProps<ParamsOf<'/games/[id]/edit'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	return (
		<div class="page">
			<header class="page-header">
				<h1>Edit game</h1>
			</header>
			<GameForm
				action={`/actions/games/${game.id}/update`}
				submitLabel="Save changes"
				cancelHref={`/games/${game.id}`}
				name={game.name}
				platform={game.platform}
				error={game.error}
			/>
		</div>
	)
}
