import { createApp, text } from '@gambrel/core'
import type { App } from '@gambrel/core'
import { errorResponse } from './errors.ts'
import { authenticate } from './middleware/authenticate.ts'
import { hostGuard } from './middleware/host-guard.ts'
import { originGuard } from './middleware/origin-guard.ts'
import { requestLogger } from './middleware/request-logger.ts'
import { applySecurityHeaders, securityHeaders } from './middleware/security-headers.ts'
import { registerHealthRoute } from './routes/health.ts'
import { registerPairingRoutes } from './routes/pairing.ts'
import type { PairingRouteDependencies } from './routes/pairing.ts'

export type HttpAppDependencies = PairingRouteDependencies

/** Builds the runtime's HTTP application with every guard in front of the routes. */
export function createHttpApp(dependencies: HttpAppDependencies): App {
	const logger = dependencies.logger.child('http')
	const app = createApp()

	app.use(securityHeaders())
	app.use(hostGuard())
	app.use(originGuard())
	app.use(requestLogger(logger))
	app.use(authenticate(dependencies.sessions))

	registerHealthRoute(app)
	registerPairingRoutes(app, { ...dependencies, logger })

	app.notFound(({ url }) =>
		url.pathname.startsWith('/api/')
			? errorResponse(404, 'not_found', 'No such endpoint.')
			: text('Not Found', { status: 404 })
	)

	app.onError((error, { url }) => {
		logger.error('Unhandled request error', { error, path: url.pathname })
		return applySecurityHeaders(errorResponse(500, 'internal_error', 'Something went wrong.'), url.pathname)
	})

	return app
}
