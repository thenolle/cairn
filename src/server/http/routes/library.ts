import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { Logger } from '../../logging/logger.ts'
import type { ArtworkService } from '../../library/artwork-service.ts'
import { parseGameForm } from '../../library/game-input.ts'
import type { LibraryService } from '../../library/library-service.ts'
import { errorResponse } from '../errors.ts'
import { readForm } from '../forms.ts'

export interface LibraryRouteDependencies {
	readonly library: LibraryService
	readonly artwork: ArtworkService
	readonly logger: Logger
}

const invalidForm = (): Response => errorResponse(400, 'invalid_form', 'The form could not be read.')

/** Form actions for the library. Each one redirects, so a refresh never repeats a change. */
export function registerLibraryRoutes(app: App, { library, artwork, logger }: LibraryRouteDependencies): void {
	app.post('/actions/games', async ({ request }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		const parsed = parseGameForm(form)
		if (!parsed.ok) return redirect(`/games/new?error=${parsed.error}`, 303)
		const game = library.add(parsed.value)
		logger.info('Game added', { id: game.id })
		return redirect(`/games/${game.id}`, 303)
	})

	app.post('/actions/games/:id/update', async ({ request, params }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		const parsed = parseGameForm(form)
		if (!parsed.ok) return redirect(`/games/${params.id}/edit?error=${parsed.error}`, 303)
		const game = library.update(params.id, parsed.value)
		return redirect(game === undefined ? '/library' : `/games/${game.id}`, 303)
	})

	app.post('/actions/games/:id/favorite', async ({ request, params }) => {
		const form = await readForm(request)
		if (form === null) return invalidForm()
		const found = library.setFavorite(params.id, form.get('favorite') === '1')
		return redirect(found ? `/games/${params.id}` : '/library', 303)
	})

	app.post('/actions/games/:id/delete', async ({ params }) => {
		if (library.remove(params.id)) {
			await artwork.removeAll(params.id)
			logger.info('Game removed', { id: params.id })
		}
		return redirect('/library', 303)
	})
}
