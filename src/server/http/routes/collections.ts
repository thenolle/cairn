import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { CollectionService } from '../../library/collection-service.ts'
import { errorResponse } from '../errors.ts'
import { readForm } from '../forms.ts'
import { backTarget } from '../redirect-back.ts'

const invalidForm = (): Response => errorResponse(400, 'invalid_form', 'The form could not be read.')

const textOf = (form: FormData, key: string): string => {
	const value = form.get(key)
	return typeof value === 'string' ? value : ''
}

/** Form actions for collections. Each one redirects, so a refresh never repeats a change. */
export function registerCollectionRoutes(app: App, collections: CollectionService): void {
	app.post('/actions/collections', async ({ request }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		const result = collections.create(textOf(form, 'name'))
		return redirect(result.ok ? '/collections' : `/collections?error=${result.error}`, 303)
	})

	app.post('/actions/collections/:id/rename', async ({ request, params }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		const result = collections.rename(params.id, textOf(form, 'name'))
		return redirect(result.ok ? '/collections' : `/collections?error=${result.error}`, 303)
	})

	app.post('/actions/collections/:id/delete', ({ params }) => {
		collections.remove(params.id)
		return redirect('/collections', 303)
	})

	app.post('/actions/games/:id/collections', async ({ request, params }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		collections.addGame(textOf(form, 'collection'), params.id)
		return redirect(backTarget(request, `/games/${params.id}`), 303)
	})

	app.post('/actions/games/:id/collections/:collectionId/remove', ({ request, params }) => {
		collections.removeGame(params.collectionId, params.id)
		return redirect(backTarget(request, `/games/${params.id}`), 303)
	})
}
