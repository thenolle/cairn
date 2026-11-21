/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { capabilities, capabilityLabels, detectionLabels } from '../../../../shared/integrations.ts'
import type { CapabilityStatus, IntegrationSummary } from '../../../../shared/integrations.ts'
import { formatTimestamp } from '../../../format.ts'
import type { loader } from './page.server.ts'
import { FolderSection } from '../../../components/folder-section.tsx'
import { EmulatorSection } from '../../../components/emulator-section.tsx'
import { MetadataSection } from '../../../components/metadata-section.tsx'

function describe(status: CapabilityStatus): { readonly text: string; readonly note: string } {
	return status.supported ? { text: 'Supported', note: '' } : { text: 'Not available', note: status.reason }
}

function Integration(props: { readonly integration: IntegrationSummary }): Child {
	const integration = props.integration
	const scan = integration.lastScan
	return (
		<section class="adapter" aria-labelledby={`${integration.id}-title`}>
			<header class="adapter-header">
				<h2 id={`${integration.id}-title`}>{integration.name}</h2>
				<span class={`status-pill status-${integration.status}`}>{detectionLabels[integration.status]}</span>
			</header>
			<p class="muted">{integration.message}</p>
			{integration.details.length === 0 ? null : (
				<dl class="facts">
					{integration.details.map((detail) => (
						<div class="fact">
							<dt>{detail.label}</dt>
							<dd>{detail.value}</dd>
						</div>
					))}
				</dl>
			)}
			{integration.status === 'ready' ? (<form method="post" action={`/actions/integrations/${integration.id}/scan`}><button class="button button-primary" type="submit">Scan now</button></form>) : null}
			{scan === null ? null : (
				<div class="scan-result" role="status">
					<p>{scan.ok ? `${formatTimestamp(new Date(scan.at).toISOString())}: ${scan.found} found, ${scan.added} added, ${scan.updated} updated, ${scan.markedNotInstalled} marked not installed.` : `${formatTimestamp(new Date(scan.at).toISOString())}: ${scan.message}`}</p>
					{scan.warnings.length === 0 ? null : (<ul class="muted">{scan.warnings.map((warning) => (<li>{warning}</li>))}</ul>)}
				</div>
			)}
			<details class="capability-details">
				<summary>What Cairn can do with {integration.name}</summary>
				<table class="capabilities">
					<thead>
						<tr>
							<th scope="col">Capability</th>
							<th scope="col">Status</th>
							<th scope="col">Note</th>
						</tr>
					</thead>
					<tbody>
						{capabilities.map((capability) => {
							const row = describe(integration.capabilities[capability])
							return (
								<tr>
									<th scope="row">{capabilityLabels[capability]}</th>
									<td>{row.text}</td>
									<td class="muted">{row.note}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</details>
		</section>
	)
}

export default function IntegrationsPage(props: PageProps<ParamsOf<'/integrations'>, LoaderData<typeof loader>>): Child {
	return (
		<div class="page">
			<header class="page-header">
				<h1>Integrations</h1>
				<p class="muted">Where Cairn finds games, and what it can do with each source. Cairn only reads from these sources.</p>
			</header>
			<FolderSection folders={props.data.folders} error={props.data.folderError} />
			<EmulatorSection emulators={props.data.emulators} error={props.data.emulatorError} />
			<MetadataSection status={props.data.metadata} />
			{props.data.integrations.map((integration) => (<Integration integration={integration} />))}
		</div>
	)
}
