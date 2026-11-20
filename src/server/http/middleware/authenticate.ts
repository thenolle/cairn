import { redirect } from '@gambrel/core'
import type { Middleware } from '@gambrel/core'
import type { SessionService } from '../../security/sessions.ts'
import { readCookie, sessionCookieName } from '../cookies.ts'
import { errorResponse } from '../errors.ts'

const publicPaths: ReadonlySet<string> = new Set(['/api/health', '/pair', '/pair.css'])

/** Requires a paired browser session for everything except the health check and the pairing page. */
export function authenticate(sessions: SessionService): Middleware {
	return (context, next) => {
		const { pathname } = context.url
		if (publicPaths.has(pathname)) return next()
		const token = readCookie(context.request.headers.get('cookie'), sessionCookieName)
		if (token !== undefined && sessions.validate(token)) return next()
		if (pathname.startsWith('/api/')) {
			return errorResponse(401, 'unauthorized', 'Pair this browser with the Cairn runtime first.')
		}
		return redirect('/pair', 303)
	}
}
