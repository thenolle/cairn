import type { Loader, ParamsOf } from '@gambrel/router'
import type { IntegrationSummary } from '../../../../shared/integrations.ts'
import type { PageContext } from '../../../context.server.ts'

export const loader: Loader<ParamsOf<'/integrations'>, { integrations: readonly IntegrationSummary[] }, PageContext> = async ({ context }) => ({
	integrations: await context.integrations.summaries()
})
