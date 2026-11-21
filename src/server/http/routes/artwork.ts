import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import { isArtworkKind, maxArtworkBytes } from '../../../shared/artwork.ts'
import type { ArtworkService } from '../../library/artwork-service.ts'
import type { LibraryService } from '../../library/library-service.ts'
import { errorResponse } from '../errors.ts'
import { readForm } from '../forms.ts'

export interface ArtworkRouteDependencies {
	readonly library: LibraryService
	readonly artwork: ArtworkService
}

const formOverhead = 65_536

/** Serves stored images to paired browsers and handles uploads and removals. */
export function registerArtworkRoutes(app: App, { library, artwork }: ArtworkRouteDependencies): void {
	app.get('/media/:id/:kind', async ({ params }) => {
		if (!isArtworkKind(params.kind)) return errorResponse(404, 'not_found', 'No such image.')
		const entry = await artwork.file(params.id, params.kind)
		if (entry === undefined) return errorResponse(404, 'not_found', 'No such image.')
		return new Response(entry.file, {
			headers: { 'content-type': entry.contentType, 'cache-control': 'private, max-age=31536000, immutable' }
		})
	})

	app.post('/actions/games/:id/artwork/:kind', async ({ request, params }) => {
		const back = `/games/${params.id}/artwork`
		if (library.get(params.id) === undefined) return redirect('/library', 303)
		if (!isArtworkKind(params.kind)) return redirect(`${back}?error=kind_invalid`, 303)

		const form = await readForm(request, { maxBytes: maxArtworkBytes + formOverhead, multipart: true })
		if (form === null) return redirect(`${back}?error=upload_unreadable`, 303)

		const file = form.get('file')
		if (!(file instanceof File) || file.size === 0) return redirect(`${back}?error=file_missing`, 303)

		const result = await artwork.save(params.id, params.kind, new Uint8Array(await file.arrayBuffer()))
		return redirect(result.ok ? back : `${back}?error=${result.error}`, 303)
	})

	app.post('/actions/games/:id/artwork/:kind/delete', async ({ params }) => {
		if (isArtworkKind(params.kind)) await artwork.remove(params.id, params.kind)
		return redirect(`/games/${params.id}/artwork`, 303)
	})
}
