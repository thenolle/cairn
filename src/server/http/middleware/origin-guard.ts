import type { Middleware } from '@gambrel/core'
import { errorResponse } from '../errors.ts'

const safeMethods: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS'])

const forbidden = (): Response => errorResponse(403, 'forbidden_origin', 'Cross-site requests are not allowed.')

/**
 * Blocks cross-site requests that change state. A request carrying an `Origin` must match its `Host`,
 * and a browser-declared `Sec-Fetch-Site: cross-site` is refused. `Origin: null` is accepted only
 * together with `Sec-Fetch-Site: same-origin`.
 */
export function originGuard(): Middleware {
	return (context, next) => {
		if (safeMethods.has(context.method)) return next()
		const fetchSite = context.request.headers.get('sec-fetch-site')
		if (fetchSite === 'cross-site') return forbidden()
		const origin = context.request.headers.get('origin')
		if (origin === 'null') return fetchSite === 'same-origin' ? next() : forbidden()
		if (origin !== null) {
			let originHost: string | null
			try {
				originHost = new URL(origin).host.toLowerCase()
			} catch {
				originHost = null
			}
			const host = context.request.headers.get('host')?.toLowerCase() ?? null
			if (originHost === null || originHost !== host) return forbidden()
		}
		return next()
	}
}
