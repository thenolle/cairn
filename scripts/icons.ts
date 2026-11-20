import { deflateSync } from 'node:zlib'
import { join } from 'node:path'

type Rgb = readonly [number, number, number]

interface Stone {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	readonly color: Rgb
}

const grid = 64
const cornerRadius = 14
const background: Rgb = [14, 17, 22]
const stones: readonly Stone[] = [
	{ x: 14, y: 40, width: 36, height: 12, color: [240, 168, 90] },
	{ x: 19, y: 26, width: 26, height: 11, color: [224, 143, 61] },
	{ x: 25, y: 14, width: 14, height: 9, color: [201, 116, 38] }
]

function pillDistance(x: number, y: number, stone: Stone): number {
	const radius = stone.height / 2
	const qx = Math.abs(x - (stone.x + stone.width / 2)) - (stone.width / 2 - radius)
	const qy = Math.abs(y - (stone.y + stone.height / 2)) - (stone.height / 2 - radius)
	return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

function squareDistance(x: number, y: number): number {
	const half = grid / 2
	const qx = Math.abs(x - half) - (half - cornerRadius)
	const qy = Math.abs(y - half) - (half - cornerRadius)
	return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cornerRadius
}

const coverage = (distance: number): number => Math.min(1, Math.max(0, 0.5 - distance))

function render(size: number, maskable: boolean): Uint8Array {
	const scale = size / grid
	const content = maskable ? 0.7 : 1
	const pixels = new Uint8Array(size * size * 4)

	for (let row = 0; row < size; row += 1) {
		for (let column = 0; column < size; column += 1) {
			const u = (column + 0.5) / scale
			const v = (row + 0.5) / scale
			let [red, green, blue] = background
			let alpha = maskable ? 1 : coverage(squareDistance(u, v) * scale)

			const contentU = grid / 2 + (u - grid / 2) / content
			const contentV = grid / 2 + (v - grid / 2) / content
			for (const stone of stones) {
				const stoneAlpha = coverage(pillDistance(contentU, contentV, stone) * scale * content)
				if (stoneAlpha === 0) continue
				const outAlpha = stoneAlpha + alpha * (1 - stoneAlpha)
				const [stoneRed, stoneGreen, stoneBlue] = stone.color
				red = (stoneRed * stoneAlpha + red * alpha * (1 - stoneAlpha)) / outAlpha
				green = (stoneGreen * stoneAlpha + green * alpha * (1 - stoneAlpha)) / outAlpha
				blue = (stoneBlue * stoneAlpha + blue * alpha * (1 - stoneAlpha)) / outAlpha
				alpha = outAlpha
			}

			const offset = (row * size + column) * 4
			pixels[offset] = Math.round(red)
			pixels[offset + 1] = Math.round(green)
			pixels[offset + 2] = Math.round(blue)
			pixels[offset + 3] = Math.round(alpha * 255)
		}
	}
	return pixels
}

function chunk(type: string, data: Uint8Array): Buffer {
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
	const length = Buffer.alloc(4)
	length.writeUInt32BE(data.length)
	const checksum = Buffer.alloc(4)
	checksum.writeUInt32BE(Bun.hash.crc32(body))
	return Buffer.concat([length, body, checksum])
}

function encodePng(size: number, rgba: Uint8Array): Buffer {
	const stride = size * 4
	const raw = Buffer.alloc((stride + 1) * size)
	for (let row = 0; row < size; row += 1) {
		raw.set(rgba.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1)
	}
	const header = Buffer.alloc(13)
	header.writeUInt32BE(size, 0)
	header.writeUInt32BE(size, 4)
	header[8] = 8
	header[9] = 6
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	])
}

/** Writes the application icons as PNG files into `directory`. */
export async function renderIcons(directory: string): Promise<void> {
	const files: readonly (readonly [string, number, boolean])[] = [
		['icon-192.png', 192, false],
		['icon-512.png', 512, false],
		['icon-maskable-512.png', 512, true],
		['apple-touch-icon.png', 180, true]
	]
	await Promise.all(files.map(([name, size, maskable]) => Bun.write(join(directory, name), encodePng(size, render(size, maskable)))))
}
