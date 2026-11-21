/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { artworkKinds } from '../../../../../../shared/artwork.ts'
import { ArtworkSlot } from '../../../../../components/artwork-slot.tsx'
import type { loader } from './page.server.ts'

export default function ArtworkPage(props: PageProps<ParamsOf<'/games/[id]/artwork'>, LoaderData<typeof loader>>): Child {
	const game = props.data
	return (
		<div class="page">
			<a class="back-link muted" href={`/games/${game.id}`}>← {game.name}</a>
			<header class="page-header page-header-row">
				<div>
					<h1>Artwork</h1>
					<p class="muted">PNG, JPEG or WebP images up to 8 MB. Images stay on this computer.</p>
				</div>
				{game.metadataAvailable ? (<form method="post" action={`/actions/games/${game.id}/metadata`}><button class="button button-primary" type="submit">Find missing artwork</button></form>) : null}
			</header>
			{game.error === null ? null : (<p class="form-error" role="alert">{game.error}</p>)}
			<div class="artwork-grid">{artworkKinds.map((kind) => (<ArtworkSlot gameId={game.id} kind={kind} url={game.art[kind]} />))}</div>
		</div>
	)
}
