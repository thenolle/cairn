export const artworkKinds = ['cover', 'hero'] as const

export type ArtworkKind = (typeof artworkKinds)[number]

export const maxArtworkBytes = 8 * 1024 * 1024

export interface ArtworkUrls {
	readonly cover: string | null
	readonly hero: string | null
}

export const artworkGuidance: Readonly<Record<ArtworkKind, { readonly label: string; readonly hint: string }>> = {
	cover: { label: 'Cover', hint: 'Portrait, 3:4. 600 × 800 pixels or larger.' },
	hero: { label: 'Banner', hint: 'Wide, 16:9. 1920 × 1080 pixels or larger.' }
}

export function isArtworkKind(value: string): value is ArtworkKind {
	return artworkKinds.some((kind) => kind === value)
}

/** The address of a stored image. The version changes whenever the image is replaced. */
export function artworkUrl(gameId: string, kind: ArtworkKind, version: number): string {
	return `/media/${gameId}/${kind}?v=${version}`
}
