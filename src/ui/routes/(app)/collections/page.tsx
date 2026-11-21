/** @jsxImportSource @gambrel/view */
import type { LoaderData, PageProps, ParamsOf } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { collectionNameMax } from '../../../../shared/collections.ts'
import { TextField } from '../../../components/fields.tsx'
import type { loader } from './page.server.ts'

export default function CollectionsPage(props: PageProps<ParamsOf<'/collections'>, LoaderData<typeof loader>>): Child {
	const view = props.data
	return (
		<div class="page">
			<header class="page-header">
				<h1>Collections</h1>
				<p class="muted">
					Group games your own way. A game can be in several collections, and deleting a collection never removes games.
				</p>
			</header>

			{view.error === null ? null : (
				<p class="folder-error" role="alert">
					{view.error}
				</p>
			)}

			<form class="folder-form" method="post" action="/actions/collections">
				<TextField name="name" label="New collection" type="text" value="" required maxLength={String(collectionNameMax)} />
				<button class="button button-primary" type="submit">
					Create
				</button>
			</form>

			{view.collections.length === 0 ? (
				<section class="empty-state" aria-labelledby="no-collections">
					<h2 id="no-collections">No collections yet</h2>
					<p class="muted">Create one above, then add games from a game's page.</p>
				</section>
			) : (
				<ul class="collection-grid">
					{view.collections.map((collection) => (
						<li class="collection-card">
							<h2>
								<a href={`/library?collection=${collection.id}`}>{collection.name}</a>
							</h2>
							<p class="muted">{collection.gameCount === 1 ? '1 game' : `${collection.gameCount} games`}</p>
							<details>
								<summary>Rename or delete</summary>
								<form class="folder-form" method="post" action={`/actions/collections/${collection.id}/rename`}>
									<TextField name="name" label="Name" type="text" value={collection.name} required maxLength={String(collectionNameMax)} />
									<button class="button button-secondary" type="submit">
										Rename
									</button>
								</form>
								<form method="post" action={`/actions/collections/${collection.id}/delete`}>
									<button class="button button-danger" type="submit">
										Delete collection
									</button>
								</form>
							</details>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
