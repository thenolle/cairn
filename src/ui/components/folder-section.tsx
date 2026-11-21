/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { folderPlatforms } from '../../shared/folders.ts'
import type { LibraryFolder } from '../../shared/folders.ts'
import { platformLabel } from '../../shared/library.ts'
import { SelectField, TextField } from './fields.tsx'

export interface FolderSectionProps {
	readonly folders: readonly LibraryFolder[]
	readonly error: string | null
}

export function FolderSection(props: FolderSectionProps): Child {
	return (
		<section class="adapter" id="folders" aria-labelledby="folders-title">
			<h2 id="folders-title">Game folders</h2>
			<p class="muted">
				Cairn looks in these folders, and the folders inside them, for Nintendo Switch, 3DS and DS game files. Files are never changed or moved.
			</p>
			{props.error === null ? null : (
				<p class="folder-error" role="alert">
					{props.error}
				</p>
			)}
			{props.folders.length === 0 ? null : (
				<ul class="folder-list">
					{props.folders.map((folder) => (
						<li>
							<span class="folder-path">{folder.path}</span>
							<span class="muted">{platformLabel(folder.platform)}</span>
							<form method="post" action={`/actions/folders/${folder.id}/remove`}>
								<button class="button button-glass" type="submit" aria-label={`Remove folder ${folder.path}`}>
									Remove
								</button>
							</form>
						</li>
					))}
				</ul>
			)}
			<form class="folder-form" method="post" action="/actions/folders">
				<TextField name="path" label="Folder path" type="text" value="" required maxLength="1024" />
				<SelectField
					name="platform"
					label="Platform"
					value="nintendo-switch"
					options={folderPlatforms.map((key) => ({ value: key, label: platformLabel(key) }))}
				/>
				<button class="button button-primary" type="submit">
					Add folder
				</button>
			</form>
		</section>
	)
}
