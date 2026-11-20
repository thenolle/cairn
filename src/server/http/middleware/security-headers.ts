import type { Middleware } from '@gambrel/core'
import { withHeaders } from '../headers.ts'

const apiPolicy = "default-src 'none'; frame-ancestors 'none'"
const pagePolicy =
	"default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; worker-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"

/** Adds defensive headers without overriding any a route has already set. */
export function applySecurityHeaders(response: Response, pathname: string): Response {
	const defaults: Readonly<Record<string, string>> = {
		'x-content-type-options': 'nosniff',
		'referrer-policy': 'same-origin',
		'x-frame-options': 'DENY',
		'cross-origin-resource-policy': 'same-origin',
		'cross-origin-opener-policy': 'same-origin',
		'cache-control': 'no-store',
		'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
		'content-security-policy': pathname.startsWith('/api/') ? apiPolicy : pagePolicy
	}
	return withHeaders(response, (headers) => {
		for (const [name, value] of Object.entries(defaults)) {
			if (!headers.has(name)) headers.set(name, value)
		}
	})
}

export function securityHeaders(): Middleware {
	return async (context, next) => applySecurityHeaders(await next(), context.url.pathname)
}
