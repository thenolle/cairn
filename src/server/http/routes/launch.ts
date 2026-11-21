import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { LaunchService } from '../../launching/launch-service.ts'

export function registerLaunchRoutes(app: App, launcher: LaunchService): void {
	app.post('/actions/games/:id/launch', async ({ params }) => {
		const outcome = await launcher.launch(params.id)
		return redirect(outcome === 'not_found' ? '/library' : `/games/${params.id}?launch=${outcome}`, 303)
	})
}
