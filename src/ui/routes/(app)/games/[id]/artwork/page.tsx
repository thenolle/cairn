/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { ArtworkSlot } from '../../../../../components/artwork-slot.tsx'
import type { loader } from './page.server.ts'

export default function ArtworkPage(props: PageProps<ParamsOf<'/games/[id]/artwork'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	return (
		<div class="page">
			<a class="back-link muted" href={`/games/${game.id}`}>
				← {game.name}
			</a>
			<header class="page-header">
				<h1>Artwork</h1>
				<p class="muted">PNG, JPEG or WebP images up to 8 MB. Images stay on this computer.</p>
			</header>
			{game.error === null ? null : (
				<p class="form-error" role="alert">
					{game.error}
				</p>
			)}
			<div class="artwork-grid">
				<ArtworkSlot gameId={game.id} kind="cover" url={game.coverUrl} />
				<ArtworkSlot gameId={game.id} kind="hero" url={game.heroUrl} />
			</div>
		</div>
	)
}
