import { redirect } from '@gambrel/core'
import type { Middleware } from '@gambrel/core'
import type { SessionService } from '../../security/sessions.ts'
import { readCookie, sessionCookieName } from '../cookies.ts'
import { errorResponse } from '../errors.ts'

const publicPaths: ReadonlySet<string> = new Set([
	'/api/health',
	'/pair',
	'/pair.css',
	'/offline',
	'/sw.js',
	'/manifest.webmanifest',
	'/favicon.ico'
])

const publicPrefixes: readonly string[] = ['/assets/']

/**
 * Requires a paired browser session. The health check, the pairing page, the offline page and the
 * static application files stay public so the installed app and its service worker can load without cookies.
 */
export function authenticate(sessions: SessionService): Middleware {
	return (context, next) => {
		const { pathname } = context.url
		if (publicPaths.has(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return next()
		const token = readCookie(context.request.headers.get('cookie'), sessionCookieName)
		if (token !== undefined && sessions.validate(token)) return next()
		if (pathname.startsWith('/api/')) {
			return errorResponse(401, 'unauthorized', 'Pair this browser with the Cairn runtime first.')
		}
		return redirect('/pair', 303)
	}
}
