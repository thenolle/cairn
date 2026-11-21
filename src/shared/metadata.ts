export type MetadataOutcome =
	| 'updated'
	| 'nothing_new'
	| 'no_match'
	| 'unconfigured'
	| 'invalid_key'
	| 'rate_limited'
	| 'failed'
	| 'not_found'

export const metadataMessages: Readonly<Record<MetadataOutcome, string>> = {
	updated: 'Artwork was added.',
	nothing_new: 'Nothing new was found, or the artwork is already set.',
	no_match: 'No artwork source knew this game.',
	unconfigured: 'No artwork source is available.',
	invalid_key: 'An artwork source did not accept its key.',
	rate_limited: 'An artwork source asked Cairn to slow down. Try again later.',
	failed: 'Artwork could not be fetched.',
	not_found: 'That game no longer exists.'
}

export function isMetadataOutcome(value: string): value is MetadataOutcome {
	return Object.hasOwn(metadataMessages, value)
}

export type BulkStop = 'limit' | 'invalid_key' | 'rate_limited'

export const bulkStopMessages: Readonly<Record<BulkStop, string>> = {
	limit: 'Stopped at the limit for one run. It continues after the next scan, or run it again.',
	invalid_key: 'Stopped because a source did not accept its key.',
	rate_limited: 'Stopped because a source asked Cairn to slow down.'
}

export type BulkSummary = {
	readonly at: number
	readonly checked: number
	readonly updated: number
	readonly failed: number
	readonly stopped: BulkStop | null
}

export type ProviderStatus = {
	readonly id: string
	readonly name: string
	readonly ready: boolean
	readonly hint: string
}

export type MetadataStatus = {
	readonly providers: readonly ProviderStatus[]
	readonly running: boolean
	readonly last: BulkSummary | null
}
