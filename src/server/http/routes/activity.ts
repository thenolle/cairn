import type { App } from '@gambrel/core'
import type { ActivityService } from '../../activity/activity-service.ts'

/** Which games are running right now. Like every other route it requires a paired browser. */
export function registerActivityRoutes(app: App, activity: ActivityService): void {
	app.get('/api/activity', () => Response.json(activity.snapshot(), { headers: { 'cache-control': 'no-store' } }))
}
