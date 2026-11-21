/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { bulkStopMessages } from '../../shared/metadata.ts'
import type { MetadataStatus } from '../../shared/metadata.ts'
import { formatTimestamp } from '../format.ts'

export interface MetadataSectionProps {
	readonly status: MetadataStatus
}

export function MetadataSection(props: MetadataSectionProps): Child {
	const { status } = props
	const last = status.last
	return (
		<section class="adapter" id="metadata" aria-labelledby="metadata-title">
			<h2 id="metadata-title">Artwork</h2>
			<p class="muted">
				Cairn can fetch covers and banners from <a href="https://www.steamgriddb.com">SteamGridDB</a> for games that have none. Artwork you set
				yourself is never replaced. SteamGridDB allows personal, non-commercial use and is not affiliated with Valve.
			</p>
			{status.configured ? (<form method="post" action="/actions/metadata/fill"><button class="button button-primary" type="submit" disabled={status.running}>{status.running ? 'Fetching…' : 'Fetch missing artwork'}</button></form>) : (<p class="notice">Create a free key in your SteamGridDB account preferences, set <code>CAIRN_STEAMGRIDDB_KEY</code> and restart Cairn.</p>)}
			{last === null ? null : (
				<div class="scan-result" role="status">
					<p>{formatTimestamp(new Date(last.at).toISOString())}: {last.checked} checked, {last.updated} updated, {last.failed} failed.</p>
					{last.stopped === null ? null : <p class="muted">{bulkStopMessages[last.stopped]}</p>}
				</div>
			)}
		</section>
	)
}
