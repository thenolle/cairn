import type { Middleware } from '@gambrel/core'
import type { Logger } from '../../logging/logger.ts'

/** Logs method, path and status. The query string is never logged because it can carry codes. */
export function requestLogger(logger: Logger): Middleware {
	return async (context, next) => {
		const started = performance.now()
		const response = await next()
		logger.debug('Request handled', {
			method: context.method,
			path: context.url.pathname,
			status: response.status,
			durationMs: Math.round(performance.now() - started)
		})
		return response
	}
}
