import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { IntegrationService } from '../../integrations/integration-service.ts'
import type { FolderService } from '../../library/folder-service.ts'
import { errorResponse } from '../errors.ts'
import { readForm } from '../forms.ts'

export function registerIntegrationRoutes(app: App, integrations: IntegrationService, folders: FolderService): void {
	app.post('/actions/integrations/:id/scan', async ({ params }) => {
		await integrations.scan(params.id)
		return redirect('/integrations', 303)
	})

	app.post('/actions/folders', async ({ request }) => {
		const form = await readForm(request)
		if (form === null) return errorResponse(400, 'invalid_form', 'The form could not be read.')
		const path = form.get('path')
		const platform = form.get('platform')
		if (typeof path !== 'string' || typeof platform !== 'string') return redirect('/integrations?folderError=invalid_path#folders', 303)
		const result = await folders.add(path, platform)
		if (!result.ok) return redirect(`/integrations?folderError=${result.error}#folders`, 303)
		await integrations.scan('folders')
		return redirect('/integrations#folders', 303)
	})

	app.post('/actions/folders/:id/remove', async ({ params }) => {
		folders.remove(params.id)
		await integrations.scan('folders')
		return redirect('/integrations#folders', 303)
	})
}
