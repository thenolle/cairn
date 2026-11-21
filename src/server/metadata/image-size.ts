export type ImageSize = { readonly width: number; readonly height: number; readonly format: 'png' | 'jpeg' | 'webp' }

const at = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0
const u16be = (bytes: Uint8Array, i: number): number => (at(bytes, i) << 8) | at(bytes, i + 1)
const u32be = (bytes: Uint8Array, i: number): number => u16be(bytes, i) * 65536 + u16be(bytes, i + 2)
const u16le = (bytes: Uint8Array, i: number): number => at(bytes, i) | (at(bytes, i + 1) << 8)
const u24le = (bytes: Uint8Array, i: number): number => at(bytes, i) | (at(bytes, i + 1) << 8) | (at(bytes, i + 2) << 16)
const ascii = (bytes: Uint8Array, i: number, length: number): string => String.fromCharCode(...bytes.subarray(i, i + length))

const make = (width: number, height: number, format: ImageSize['format']): ImageSize | null => width > 0 && height > 0 ? { width, height, format } : null

/** The pixel size of a PNG, JPEG or WebP image, read from its header. Null when it cannot be read. */
export function imageSize(bytes: Uint8Array): ImageSize | null {
	if (bytes.length > 24 && at(bytes, 0) === 0x89 && ascii(bytes, 1, 3) === 'PNG') return make(u32be(bytes, 16), u32be(bytes, 20), 'png')
	if (at(bytes, 0) === 0xff && at(bytes, 1) === 0xd8) {
		let index = 2
		while (index + 9 < bytes.length) {
			if (at(bytes, index) !== 0xff) {
				index += 1
				continue
			}
			const marker = at(bytes, index + 1)
			if (marker === 0xff) {
				index += 1
				continue
			}
			if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
				return make(u16be(bytes, index + 7), u16be(bytes, index + 5), 'jpeg')
			}
			if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
				index += 2
				continue
			}
			index += 2 + u16be(bytes, index + 2)
		}
		return null
	}
	if (bytes.length > 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
		const chunk = ascii(bytes, 12, 4)
		if (chunk === 'VP8 ') return make(u16le(bytes, 26) & 0x3fff, u16le(bytes, 28) & 0x3fff, 'webp')
		if (chunk === 'VP8L') {
			const bits = (u16le(bytes, 21) | (u16le(bytes, 23) << 16)) >>> 0
			return make(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff), 'webp')
		}
		if (chunk === 'VP8X') return make(1 + u24le(bytes, 24), 1 + u24le(bytes, 27), 'webp')
	}
	return null
}
