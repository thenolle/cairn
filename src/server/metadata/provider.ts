import type { ArtworkKind } from '../../shared/artwork.ts'
import type { Game } from '../../shared/library.ts'

export type ArtworkOffer = {
	readonly kind: ArtworkKind
	readonly score: number
	readonly load: () => Promise<Uint8Array | null>
}

/** A place artwork can come from. `find` only lists what is on offer; the service downloads and stores it. */
export interface ArtworkProvider {
	readonly id: string
	readonly name: string
	/** What to do to make the provider available. Shown while it is not ready. */
	readonly hint: string
	ready(): boolean
	find(game: Game, wanted: ReadonlySet<ArtworkKind>): Promise<readonly ArtworkOffer[]>
}
