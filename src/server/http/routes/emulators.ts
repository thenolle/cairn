import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { EmulatorService } from '../../emulators/emulator-service.ts'
import { errorResponse } from '../errors.ts'
import { readForm } from '../forms.ts'

const textOf = (form: FormData, key: string): string => {
	const value = form.get(key)
	return typeof value === 'string' ? value : ''
}

export function registerEmulatorRoutes(app: App, emulators: EmulatorService): void {
	app.post('/actions/emulators', async ({ request }) => {
		const form = await readForm(request)
		if (form === null) return errorResponse(400, 'invalid_form', 'The form could not be read.')
		const result = await emulators.save({
			platform: textOf(form, 'platform'),
			name: textOf(form, 'name'),
			executable: textOf(form, 'executable'),
			arguments: textOf(form, 'arguments')
		})
		return redirect(result.ok ? '/integrations#emulators' : `/integrations?emulatorError=${result.error}#emulators`, 303)
	})

	app.post('/actions/emulators/:platform/remove', ({ params }) => {
		emulators.remove(params.platform)
		return redirect('/integrations#emulators', 303)
	})
}
