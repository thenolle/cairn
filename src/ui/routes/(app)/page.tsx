/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export default function LibraryPage(): Child {
	return (
		<div class="page">
			<header class="page-header">
				<h1>Library</h1>
			</header>
			<section class="empty-state" aria-labelledby="empty-title">
				<h2 id="empty-title">Your library is empty</h2>
				<p class="muted">Games from your launchers, emulators and folders will appear here, arranged around their artwork.</p>
			</section>
		</div>
	)
}
