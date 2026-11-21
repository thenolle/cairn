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
	no_match: 'No matching game was found on SteamGridDB.',
	unconfigured: 'Set CAIRN_STEAMGRIDDB_KEY and restart Cairn to fetch artwork.',
	invalid_key: 'SteamGridDB did not accept the key.',
	rate_limited: 'SteamGridDB asked Cairn to slow down. Try again later.',
	failed: 'Artwork could not be fetched.',
	not_found: 'That game no longer exists.'
}

export function isMetadataOutcome(value: string): value is MetadataOutcome {
	return Object.hasOwn(metadataMessages, value)
}

export type BulkStop = 'limit' | 'invalid_key' | 'rate_limited'

export const bulkStopMessages: Readonly<Record<BulkStop, string>> = {
	limit: 'Stopped at the limit for one run. Run it again to continue.',
	invalid_key: 'Stopped because SteamGridDB did not accept the key.',
	rate_limited: 'Stopped because SteamGridDB asked Cairn to slow down.'
}

export type BulkSummary = {
	readonly at: number
	readonly checked: number
	readonly updated: number
	readonly failed: number
	readonly stopped: BulkStop | null
}

export type MetadataStatus = {
	readonly configured: boolean
	readonly running: boolean
	readonly last: BulkSummary | null
}
