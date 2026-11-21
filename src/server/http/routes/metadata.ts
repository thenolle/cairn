import { redirect } from '@gambrel/core'
import type { App } from '@gambrel/core'
import type { MetadataService } from '../../metadata/metadata-service.ts'

export function registerMetadataRoutes(app: App, metadata: MetadataService): void {
	app.post('/actions/games/:id/metadata', async ({ params }) => {
		const outcome = await metadata.fetchFor(params.id)
		return redirect(outcome === 'not_found' ? '/library' : `/games/${params.id}?metadata=${outcome}`, 303)
	})

	app.post('/actions/metadata/fill', () => {
		metadata.startBulk()
		return redirect('/integrations#metadata', 303)
	})
}
