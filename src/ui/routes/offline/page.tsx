/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export default function OfflinePage(): Child {
	return (
		<main class="standalone-page">
			<p class="eyebrow">Offline</p>
			<h1>Cairn is not reachable</h1>
			<p class="muted">The Cairn runtime on this computer is not responding. Start it, then try again. Your library and saves are stored locally and are not affected.</p>
			<a class="button" href="/">
				Try again
			</a>
		</main>
	)
}
