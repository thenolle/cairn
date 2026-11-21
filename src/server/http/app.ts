import { staticFiles } from '@gambrel/bun'
import { createApp } from '@gambrel/core'
import type { App } from '@gambrel/core'
import { createDocumentHandler } from '@gambrel/ssr'
import { components, hooks, routes } from '../../../.gambrel/manifest.server.ts'
import type { PageContext } from '../../ui/context.server.ts'
import { renderError } from '../../ui/error-document.tsx'
import type { ArtworkService } from '../library/artwork-service.ts'
import type { LibraryService } from '../library/library-service.ts'
import type { RuntimeInfo } from '../runtime-info.ts'
import { errorResponse } from './errors.ts'
import { authenticate } from './middleware/authenticate.ts'
import { hostGuard } from './middleware/host-guard.ts'
import { originGuard } from './middleware/origin-guard.ts'
import { requestLogger } from './middleware/request-logger.ts'
import { applySecurityHeaders, securityHeaders } from './middleware/security-headers.ts'
import { registerArtworkRoutes } from './routes/artwork.ts'
import { registerHealthRoute } from './routes/health.ts'
import { registerLibraryRoutes } from './routes/library.ts'
import { registerPairingRoutes } from './routes/pairing.ts'
import type { PairingRouteDependencies } from './routes/pairing.ts'
import { registerPwaRoutes } from './routes/pwa.ts'

export interface HttpAppDependencies extends PairingRouteDependencies {
	readonly runtime: RuntimeInfo
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly clientDirectory: string
	readonly development: boolean
}

/**
 * Builds the HTTP application. Guards run first and wrap every response, including rejections.
 * Explicit routes win; everything else becomes a page request for the Gambrel document handler.
 */
export function createHttpApp(dependencies: HttpAppDependencies): App {
	const logger = dependencies.logger.child('http')
	const { runtime, library, artwork, clientDirectory, development } = dependencies
	const documents = createDocumentHandler<PageContext>({
		routes,
		components,
		hooks,
		entry: '/assets/client.js',
		development,
		renderError
	})
	const app = createApp({ development })

	app.use(securityHeaders())
	app.use(hostGuard())
	app.use(originGuard())
	app.use(requestLogger(logger))
	app.use(authenticate(dependencies.sessions))
	app.use(staticFiles({ directory: clientDirectory, prefix: '/assets' }))

	registerHealthRoute(app)
	registerPwaRoutes(app, clientDirectory)
	registerPairingRoutes(app, { ...dependencies, logger })
	registerLibraryRoutes(app, { library, artwork, logger })
	registerArtworkRoutes(app, { library, artwork })

	app.notFound((context) =>
		context.url.pathname.startsWith('/api/')
			? errorResponse(404, 'not_found', 'No such endpoint.')
			: documents.handle(context.request, { ...context, runtime, library, artwork })
	)

	app.onError((error, { url }) => {
		logger.error('Unhandled request error', { error, path: url.pathname })
		return applySecurityHeaders(errorResponse(500, 'internal_error', 'Something went wrong.'), url.pathname)
	})

	return app
}
