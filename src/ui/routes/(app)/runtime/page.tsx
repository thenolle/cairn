/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { formatDuration, formatTimestamp } from '../../../format.ts'
import type { loader } from './page.server.ts'

export default function RuntimePage(props: PageProps<ParamsOf<'/runtime'>, LoaderData<typeof loader>>): Child {
	const runtime = props.data
	return (
		<div class="page">
			<header class="page-header">
				<h1>Runtime</h1>
				<p class="muted">The background service that powers Cairn on this computer.</p>
			</header>
			<dl class="facts">
				<div class="fact">
					<dt>Status</dt>
					<dd class="status">Running</dd>
				</div>
				<div class="fact">
					<dt>Version</dt>
					<dd>{runtime.version}</dd>
				</div>
				<div class="fact">
					<dt>Uptime</dt>
					<dd>{formatDuration(runtime.uptimeSeconds)}</dd>
				</div>
				<div class="fact">
					<dt>Started</dt>
					<dd>{formatTimestamp(runtime.startedAt)}</dd>
				</div>
				<div class="fact">
					<dt>Address</dt>
					<dd>{runtime.address}</dd>
				</div>
				<div class="fact">
					<dt>Platform</dt>
					<dd>{`${runtime.platform} · ${runtime.architecture}`}</dd>
				</div>
				<div class="fact">
					<dt>Database schema</dt>
					<dd>{String(runtime.schemaVersion)}</dd>
				</div>
			</dl>
		</div>
	)
}
