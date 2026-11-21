/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { artworkGuidance } from '../../shared/artwork.ts'
import type { ArtworkKind } from '../../shared/artwork.ts'

export interface ArtworkSlotProps {
	readonly gameId: string
	readonly kind: ArtworkKind
	readonly url: string | null
}

export function ArtworkSlot(props: ArtworkSlotProps): Child {
	const guidance = artworkGuidance[props.kind]
	const action = `/actions/games/${props.gameId}/artwork/${props.kind}`
	return (
		<section class="artwork-slot" aria-labelledby={`slot-${props.kind}`}>
			<h2 id={`slot-${props.kind}`}>{guidance.label}</h2>
			<p class="muted">{guidance.hint}</p>
			{props.url === null ? (
				<p class="muted">Nothing set. Cairn shows a tinted tile with the game's initials instead.</p>
			) : (
				<img class={`artwork-preview artwork-preview-${props.kind}`} src={props.url} alt="" />
			)}
			<form class="form" method="post" enctype="multipart/form-data" action={action}>
				<label class="field">
					<span class="field-label">Image file</span>
					<input type="file" name="file" accept="image/png,image/jpeg,image/webp" required />
				</label>
				<button class="button" type="submit">
					{props.url === null ? 'Upload' : 'Replace'}
				</button>
			</form>
			{props.url === null ? null : (
				<form method="post" action={`${action}/delete`}>
					<button class="button button-secondary" type="submit">
						Remove {guidance.label.toLowerCase()}
					</button>
				</form>
			)}
		</section>
	)
}
