import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { maxArtworkBytes } from '../../../shared/artwork.ts'
import type { ArtworkKind } from '../../../shared/artwork.ts'
import { imageSize } from '../image-size.ts'
import type { ArtworkOffer, ArtworkProvider } from '../provider.ts'

export interface LocalSteamOptions {
	readonly locateRoot: () => Promise<string | null>
}

/** File names Steam has used for each picture. Known names win over guesses made from the image's shape. */
const knownNames: ReadonlyArray<readonly [name: string, kind: ArtworkKind, score: number]> = [
	['library_600x900.jpg', 'cover', 1090],
	['library_hero.jpg', 'hero', 1090],
	['logo.png', 'logo', 1080],
	['header.jpg', 'hero', 1030],
	['icon.jpg', 'icon', 1050]
]

async function readBytes(path: string): Promise<Uint8Array | null> {
	try {
		const file = Bun.file(path)
		if (file.size === 0 || file.size > maxArtworkBytes) return null
		return new Uint8Array(await file.arrayBuffer())
	} catch {
		return null
	}
}

function classify(bytes: Uint8Array): { kind: ArtworkKind; score: number } | null {
	const size = imageSize(bytes)
	if (size === null) return null
	const ratio = size.width / size.height
	const area = (size.width * size.height) / 10_000
	if (size.height / size.width >= 1.35 && size.height / size.width <= 1.65) return { kind: 'cover', score: area }
	if (ratio >= 2.8) return { kind: 'hero', score: area }
	if (ratio >= 2) return { kind: 'hero', score: area / 4 }
	if (ratio >= 0.9 && ratio <= 1.1 && size.width <= 512) return { kind: 'icon', score: area }
	return size.format === 'png' ? { kind: 'logo', score: area } : null
}

/** Reads the pictures Steam already keeps on this computer. It needs no network and no key. */
export function createLocalSteamProvider(options: LocalSteamOptions): ArtworkProvider {
	return {
		id: 'steam-local',
		name: 'Steam image cache',
		hint: 'Reads the images Steam keeps on this computer.',
		ready: () => true,
		async find(game, wanted): Promise<readonly ArtworkOffer[]> {
			const appId = game.sourceId
			if (game.source !== 'steam' || appId === null || !/^\d{1,10}$/u.test(appId)) return []
			const root = await options.locateRoot()
			if (root === null) return []
			const cache = join(root, 'appcache', 'librarycache')
			const found = new Map<ArtworkKind, { score: number; bytes: Uint8Array }>()
			const consider = (kind: ArtworkKind, score: number, bytes: Uint8Array): void => {
				if (!wanted.has(kind)) return
				const current = found.get(kind)
				if (current === undefined || score > current.score) found.set(kind, { score, bytes })
			}
			for (const [name, kind, score] of knownNames) {
				if (!wanted.has(kind)) continue
				const bytes = await readBytes(join(cache, `${appId}_${name}`))
				if (bytes !== null) consider(kind, score, bytes)
			}
			let names: string[] = []
			try { names = await readdir(join(cache, appId)) } catch { names = [] }
			for (const name of names.slice(0, 40)) {
				if (!/\.(png|jpe?g|webp)$/iu.test(name)) continue
				const bytes = await readBytes(join(cache, appId, name))
				if (bytes === null) continue
				const known = knownNames.find(([candidate]) => candidate === name.toLowerCase())
				if (known !== undefined) consider(known[1], known[2], bytes)
				else {
					const guess = classify(bytes)
					if (guess !== null) consider(guess.kind, guess.score, bytes)
				}
			}
			return [...found].map(([kind, entry]) => ({ kind, score: entry.score, load: () => Promise.resolve(entry.bytes) }))
		}
	}
}
