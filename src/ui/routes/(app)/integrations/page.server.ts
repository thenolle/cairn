import type { Loader, ParamsOf } from '@gambrel/router'
import { emulatorErrorMessages, isEmulatorError } from '../../../../shared/emulators.ts'
import type { EmulatorProfile } from '../../../../shared/emulators.ts'
import { folderErrorMessages, isFolderError } from '../../../../shared/folders.ts'
import type { LibraryFolder } from '../../../../shared/folders.ts'
import type { IntegrationSummary } from '../../../../shared/integrations.ts'
import type { PageContext } from '../../../context.server.ts'

export type IntegrationsView = {
	readonly integrations: readonly IntegrationSummary[]
	readonly folders: readonly LibraryFolder[]
	readonly folderError: string | null
	readonly emulators: readonly EmulatorProfile[]
	readonly emulatorError: string | null
}

export const loader: Loader<ParamsOf<'/integrations'>, IntegrationsView, PageContext> = async ({ context, search }) => {
	const params = new URLSearchParams(search)
	const folderCode = params.get('folderError')
	const emulatorCode = params.get('emulatorError')
	return {
		integrations: await context.integrations.summaries(),
		folders: context.folders.list(),
		folderError: folderCode !== null && isFolderError(folderCode) ? folderErrorMessages[folderCode] : null,
		emulators: context.emulators.list(),
		emulatorError: emulatorCode !== null && isEmulatorError(emulatorCode) ? emulatorErrorMessages[emulatorCode] : null
	}
}
