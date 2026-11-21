import { hydrateRoutes } from '@gambrel/browser'
import { components, routes } from '../../.gambrel/manifest.client.ts'
import { initActivity } from './activity.ts'
import { initRows, initTopbar } from './enhance.ts'
import { registerServiceWorker } from './pwa.ts'

try {
	hydrateRoutes({ routes, components })
} catch (error) {
	console.error('[cairn] hydration failed; the server-rendered page stays as it is', error)
}

initTopbar()
initRows()
initActivity()
registerServiceWorker()
