import type { Middleware } from '@gambrel/core'
import { errorResponse } from '../errors.ts'

const allowedHostnames: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

function hostnameOf(value: string | null): string | null {
	if (value === null) return null
	try {
		return new URL(`http://${value}`).hostname.toLowerCase()
	} catch {
		return null
	}
}

/**
 * Rejects requests addressed to any host name other than a loopback name.
 * This stops DNS rebinding, where a hostile site points its own domain at the local runtime.
 */
export function hostGuard(): Middleware {
	return (context, next) => {
		const hostname = hostnameOf(context.request.headers.get('host'))
		if (hostname === null || !allowedHostnames.has(hostname)) {
			return errorResponse(421, 'misdirected_request', 'This host name is not allowed.')
		}
		return next()
	}
}
