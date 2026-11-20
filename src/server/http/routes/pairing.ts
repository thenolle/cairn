import { html, text } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { Logger } from '../../logging/logger.ts'
import type { FailureLimiter } from '../../security/failure-limiter.ts'
import type { PairingService } from '../../security/pairing.ts'
import type { SessionService } from '../../security/sessions.ts'
import { tokenPattern } from '../../security/tokens.ts'
import { sessionCookie } from '../cookies.ts'
import { errorResponse } from '../errors.ts'
import { pairStyles, renderPairPage } from '../pages/pair.ts'

export interface PairingRouteDependencies {
	readonly pairing: PairingService
	readonly sessions: SessionService
	readonly limiter: FailureLimiter
	readonly logger: Logger
}

const limiterKey = 'pairing'
const maxBodyBytes = 1024

async function readCode(request: Request): Promise<string | null> {
	const type = request.headers.get('content-type') ?? ''
	if (!type.startsWith('application/x-www-form-urlencoded')) return null
	try {
		const code = (await request.formData()).get('code')
		return typeof code === 'string' ? code : null
	} catch {
		return null
	}
}

export function registerPairingRoutes(app: App, dependencies: PairingRouteDependencies): void {
	const { pairing, sessions, limiter, logger } = dependencies

	app.get('/pair.css', () => text(pairStyles, { headers: { 'content-type': 'text/css; charset=utf-8' } }))

	app.get('/pair', ({ url }) => {
		const code = url.searchParams.get('code')
		return html(renderPairPage(code !== null && tokenPattern.test(code) ? code : null))
	})

	app.post('/pair', async ({ request }) => {
		const retryAfter = limiter.retryAfterSeconds(limiterKey)
		if (retryAfter > 0) {
			return errorResponse(429, 'too_many_attempts', 'Too many pairing attempts. Try again shortly.', {
				'retry-after': String(retryAfter)
			})
		}

		const length = request.headers.get('content-length')
		if (length === null || !(Number(length) <= maxBodyBytes)) {
			return errorResponse(413, 'payload_too_large', 'The request body is too large.')
		}

		const code = await readCode(request)
		if (code === null || !pairing.consume(code)) {
			limiter.recordFailure(limiterKey)
			logger.warn('Pairing attempt rejected')
			return html(renderPairPage(null, 'That pairing code is invalid or has expired.'), { status: 403 })
		}

		limiter.reset(limiterKey)
		const session = sessions.create()
		logger.info('Browser paired')
		return new Response(null, {
			status: 303,
			headers: { location: '/', 'set-cookie': sessionCookie(session.token, session.maxAgeSeconds) }
		})
	})
}
