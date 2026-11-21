export const artworkKinds = ['cover', 'hero', 'logo', 'icon'] as const

export type ArtworkKind = (typeof artworkKinds)[number]

export const maxArtworkBytes = 8 * 1024 * 1024

export type ArtworkUrls = {
	readonly cover: string | null
	readonly hero: string | null
	readonly logo: string | null
	readonly icon: string | null
}

export const emptyArtwork: ArtworkUrls = { cover: null, hero: null, logo: null, icon: null }

export const artworkGuidance: Readonly<Record<ArtworkKind, { readonly label: string; readonly hint: string }>> = {
	cover: { label: 'Cover', hint: 'Portrait, 2:3. 600 × 900 pixels or larger.' },
	hero: { label: 'Banner', hint: 'Wide. 1920 × 1080 pixels or larger. The middle is shown on small screens.' },
	logo: { label: 'Logo', hint: 'The title on a transparent background (PNG or WebP). Shown over the banner.' },
	icon: { label: 'Icon', hint: 'Square. 256 × 256 pixels or larger.' }
}

export function isArtworkKind(value: string): value is ArtworkKind {
	return artworkKinds.some((kind) => kind === value)
}

/** The address of a stored image. The version changes whenever the image is replaced. */
export function artworkUrl(gameId: string, kind: ArtworkKind, version: number): string {
	return `/media/${gameId}/${kind}?v=${version}`
}
