import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { IntegrationService } from '../../integrations/integration-service.ts'

export function registerIntegrationRoutes(app: App, integrations: IntegrationService): void {
	app.post('/actions/integrations/:id/scan', async ({ params }) => {
		await integrations.scan(params.id)
		return redirect('/integrations', 303)
	})
}
