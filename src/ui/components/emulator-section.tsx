/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import type { EmulatorProfile } from '../../shared/emulators.ts'
import { folderPlatforms } from '../../shared/folders.ts'
import { platformLabel } from '../../shared/library.ts'
import { TextField } from './fields.tsx'

export interface EmulatorSectionProps {
	readonly emulators: readonly EmulatorProfile[]
	readonly error: string | null
}

export function EmulatorSection(props: EmulatorSectionProps): Child {
	return (
		<section class="adapter" id="emulators" aria-labelledby="emulators-title">
			<h2 id="emulators-title">Emulators</h2>
			<p class="muted">
				Choose the program that plays each platform's games. Arguments are separated by spaces, and {'{game}'} is replaced by the game's file.
				Examples: melonDS <code>-f {'{game}'}</code>, Eden <code>-f -g {'{game}'}</code>. Run the emulator with <code>--help</code> to check its options.
			</p>
			{props.error === null ? null : (<p class="folder-error" role="alert">{props.error}</p>)}
			{folderPlatforms.map((platform) => {
				const current = props.emulators.find((emulator) => emulator.platform === platform)
				return (
					<div class="emulator-card">
						<h3>{platformLabel(platform)}</h3>
						<form class="folder-form" method="post" action="/actions/emulators">
							<input type="hidden" name="platform" value={platform} />
							<TextField name="name" label="Emulator name" type="text" value={current?.name ?? ''} required maxLength="60" />
							<TextField name="executable" label="Program path" type="text" value={current?.executable ?? ''} required maxLength="1024" />
							<TextField name="arguments" label="Arguments" type="text" value={current?.arguments ?? '{game}'} required maxLength="400" />
							<button class="button button-primary" type="submit">{current === undefined ? 'Save' : 'Update'}</button>
						</form>
						{current === undefined ? null : (<form method="post" action={`/actions/emulators/${platform}/remove`}><button class="button button-glass" type="submit">Remove {current.name}</button></form>)}
					</div>
				)
			})}
		</section>
	)
}
