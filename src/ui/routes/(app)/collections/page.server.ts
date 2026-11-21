import type { Loader, ParamsOf } from '@gambrel/router'
import { collectionErrorMessages, isCollectionError } from '../../../../shared/collections.ts'
import type { Collection } from '../../../../shared/collections.ts'
import type { PageContext } from '../../../context.server.ts'

export type CollectionsView = {
	readonly collections: readonly Collection[]
	readonly error: string | null
}

export const loader: Loader<ParamsOf<'/collections'>, CollectionsView, PageContext> = ({ search, context }) => {
	const code = new URLSearchParams(search).get('error')
	return {
		collections: context.collections.list(),
		error: code !== null && isCollectionError(code) ? collectionErrorMessages[code] : null
	}
}
