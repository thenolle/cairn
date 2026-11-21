import type { Loader, ParamsOf } from '@gambrel/router'
import { folderErrorMessages, isFolderError } from '../../../../shared/folders.ts'
import type { LibraryFolder } from '../../../../shared/folders.ts'
import type { IntegrationSummary } from '../../../../shared/integrations.ts'
import type { PageContext } from '../../../context.server.ts'

export type IntegrationsView = {
	readonly integrations: readonly IntegrationSummary[]
	readonly folders: readonly LibraryFolder[]
	readonly folderError: string | null
}

export const loader: Loader<ParamsOf<'/integrations'>, IntegrationsView, PageContext> = async ({ context, search }) => {
	const code = new URLSearchParams(search).get('folderError')
	return {
		integrations: await context.integrations.summaries(),
		folders: context.folders.list(),
		folderError: code !== null && isFolderError(code) ? folderErrorMessages[code] : null
	}
}
