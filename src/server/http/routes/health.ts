import { json } from '@gambrel/core'
import type { App } from '@gambrel/core'

export function registerHealthRoute(app: App): void {
	app.get('/api/health', () => json({ status: 'ok' }))
}
