export interface ImageType {
	readonly contentType: 'image/png' | 'image/jpeg' | 'image/webp'
	readonly extension: 'png' | 'jpg' | 'webp'
}

function hasBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
	return signature.every((value, index) => bytes[offset + index] === value)
}

/** Identifies PNG, JPEG and WebP images from their first bytes. Anything else returns null. */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
	if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: 'image/png', extension: 'png' }
	if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return { contentType: 'image/jpeg', extension: 'jpg' }
	if (hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return { contentType: 'image/webp', extension: 'webp' }
	return null
}
