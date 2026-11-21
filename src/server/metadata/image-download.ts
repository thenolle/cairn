import type { Fetcher } from './steamgriddb-client.ts'

const maxHops = 3

export type HostRule = (hostname: string) => boolean

export function isAllowedImageHost(hostname: string): boolean {
	return hostname === 'steamgriddb.com' || hostname.endsWith('.steamgriddb.com')
}

function allowed(url: URL, host: HostRule): boolean {
	return url.protocol === 'https:' && url.username === '' && url.password === '' && host(url.hostname)
}

/**
 * Downloads an image. The address and every redirect must be HTTPS on a host the caller allows, and the
 * download stops as soon as it passes `maxBytes`. Resolves to null when anything is off.
 */
export async function downloadImage(link: string, maxBytes: number, fetcher: Fetcher, host: HostRule, timeoutMs = 20_000): Promise<Uint8Array | null> {
	try {
		let current = new URL(link)
		for (let hop = 0; hop <= maxHops; hop += 1) {
			if (!allowed(current, host)) return null
			const response = await fetcher(current.href, {
				signal: AbortSignal.timeout(timeoutMs),
				redirect: 'manual',
				headers: { accept: 'image/png,image/jpeg,image/webp' }
			})
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get('location')
				if (location === null) return null
				current = new URL(location, current)
				continue
			}
			if (!response.ok || response.body === null) return null
			if (Number(response.headers.get('content-length') ?? '0') > maxBytes) return null
			const reader = response.body.getReader()
			const chunks: Uint8Array[] = []
			let total = 0
			for (; ;) {
				const { done, value } = await reader.read()
				if (done) break
				total += value.length
				if (total > maxBytes) {
					await reader.cancel()
					return null
				}
				chunks.push(value)
			}
			const bytes = new Uint8Array(total)
			let offset = 0
			for (const chunk of chunks) {
				bytes.set(chunk, offset)
				offset += chunk.length
			}
			return bytes
		}
	} catch {
		return null
	}
	return null
}
