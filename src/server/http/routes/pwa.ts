import { join } from 'node:path'
import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import { errorResponse } from '../errors.ts'

/** Serves the files that must live at the site root: the service worker and the web app manifest. */
export function registerPwaRoutes(app: App, clientDirectory: string): void {
	const serveFile = (name: string, contentType: string) => async (): Promise<Response> => {
		const file = Bun.file(join(clientDirectory, name))
		if (!(await file.exists())) return errorResponse(404, 'not_found', 'The interface has not been built.')
		return new Response(file, { headers: { 'content-type': contentType, 'cache-control': 'no-cache' } })
	}

	app.get('/sw.js', serveFile('sw.js', 'text/javascript; charset=utf-8'))
	app.get('/manifest.webmanifest', serveFile('manifest.webmanifest', 'application/manifest+json'))
	app.get('/favicon.ico', () => redirect('/assets/favicon.svg', 302))
}
