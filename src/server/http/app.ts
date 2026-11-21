import { staticFiles } from '@gambrel/bun'
import { createApp } from '@gambrel/core'
import type { App } from '@gambrel/core'
import { createDocumentHandler } from '@gambrel/ssr'
import { components, hooks, routes } from '../../../.gambrel/manifest.server.ts'
import type { PageContext } from '../../ui/context.server.ts'
import { renderError } from '../../ui/error-document.tsx'
import type { IntegrationService } from '../integrations/integration-service.ts'
import type { ArtworkService } from '../library/artwork-service.ts'
import type { CollectionService } from '../library/collection-service.ts'
import type { LibraryService } from '../library/library-service.ts'
import type { RuntimeInfo } from '../runtime-info.ts'
import { errorResponse } from './errors.ts'
import { authenticate } from './middleware/authenticate.ts'
import { hostGuard } from './middleware/host-guard.ts'
import { originGuard } from './middleware/origin-guard.ts'
import { requestLogger } from './middleware/request-logger.ts'
import { applySecurityHeaders, securityHeaders } from './middleware/security-headers.ts'
import { registerArtworkRoutes } from './routes/artwork.ts'
import { registerCollectionRoutes } from './routes/collections.ts'
import { registerHealthRoute } from './routes/health.ts'
import { registerIntegrationRoutes } from './routes/integrations.ts'
import { registerLibraryRoutes } from './routes/library.ts'
import { registerPairingRoutes } from './routes/pairing.ts'
import type { PairingRouteDependencies } from './routes/pairing.ts'
import { registerPwaRoutes } from './routes/pwa.ts'
import type { FolderService } from '../library/folder-service.ts'
import type { LaunchService } from '../launching/launch-service.ts'
import { registerLaunchRoutes } from './routes/launch.ts'
import type { ActivityService } from '../activity/activity-service.ts'
import { registerActivityRoutes } from './routes/activity.ts'
import type { EmulatorService } from '../emulators/emulator-service.ts'
import { registerEmulatorRoutes } from './routes/emulators.ts'

export interface HttpAppDependencies extends PairingRouteDependencies {
	readonly runtime: RuntimeInfo
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly integrations: IntegrationService
	readonly clientDirectory: string
	readonly development: boolean
	readonly folders: FolderService
	readonly collections: CollectionService
	readonly launcher: LaunchService
	readonly activity: ActivityService
	readonly emulators: EmulatorService
}

/**
 * Builds the HTTP application. Guards run first and wrap every response, including rejections.
 * Explicit routes win; everything else becomes a page request for the Gambrel document handler.
 */
export function createHttpApp(dependencies: HttpAppDependencies): App {
	const logger = dependencies.logger.child('http')
	const { runtime, library, artwork, integrations, clientDirectory, development, folders, collections, launcher, activity, emulators } = dependencies
	const documents = createDocumentHandler<PageContext>({ routes, components, hooks, entry: '/assets/client.js', development, renderError })
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
	registerIntegrationRoutes(app, integrations, folders)
	registerCollectionRoutes(app, collections)
	registerLaunchRoutes(app, launcher)
	registerActivityRoutes(app, activity)
	registerEmulatorRoutes(app, emulators)
	app.notFound((context) => context.url.pathname.startsWith('/api/') ? errorResponse(404, 'not_found', 'No such endpoint.') : documents.handle(context.request, { ...context, runtime, library, artwork, integrations, folders, collections, launcher, activity, emulators }))
	app.onError((error, { url }) => {
		logger.error('Unhandled request error', { error, path: url.pathname })
		return applySecurityHeaders(errorResponse(500, 'internal_error', 'Something went wrong.'), url.pathname)
	})
	return app
}
