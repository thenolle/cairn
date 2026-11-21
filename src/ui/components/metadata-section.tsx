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
				Cairn looks for covers, banners, logos and icons for games that lack them, trying each source in order. Pictures you set yourself are never
				replaced. New games are searched automatically in the background.
			</p>
			<ul class="provider-list">
				{status.providers.map((provider) => (
					<li>
						<span>{provider.name}</span>
						<span class={provider.ready ? 'status-pill status-ready' : 'status-pill'}>{provider.ready ? 'Ready' : 'Not set up'}</span>
						{provider.ready ? null : <span class="provider-hint">{provider.hint}</span>}
					</li>
				))}
			</ul>
			<form method="post" action="/actions/metadata/fill"><button class="button button-primary" type="submit" disabled={status.running}>{status.running ? 'Fetching…' : 'Fetch missing artwork'}</button></form>
			{last === null ? null : (
				<div class="scan-result" role="status">
					<p>{formatTimestamp(new Date(last.at).toISOString())}: {last.checked} checked, {last.updated} updated, {last.failed} failed.</p>
					{last.stopped === null ? null : <p class="muted">{bulkStopMessages[last.stopped]}</p>}
				</div>
			)}
			<p class="muted">
				Sources: your Steam image cache and Steam's public images, <a href="https://www.steamgriddb.com">SteamGridDB</a> and{' '}
				<a href="https://www.igdb.com">IGDB</a>. SteamGridDB and IGDB allow personal, non-commercial use.
			</p>
		</section>
	)
}
