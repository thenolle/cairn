/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'
import { platforms } from '../../shared/library.ts'
import { SelectField, TextField } from './fields.tsx'

export interface GameFormProps {
	readonly action: string
	readonly submitLabel: string
	readonly cancelHref: string
	readonly name: string
	readonly platform: string
	readonly error: string | null
}

const platformOptions = platforms.map((platform) => ({ value: platform.key, label: platform.label }))

export function GameForm(props: GameFormProps): Child {
	return (
		<form class="form" method="post" action={props.action}>
			{props.error === null ? null : (
				<p class="form-error" role="alert">
					{props.error}
				</p>
			)}
			<TextField name="name" label="Name" type="text" value={props.name} required maxLength="200" />
			<SelectField name="platform" label="Platform" options={platformOptions} value={props.platform} />
			<div class="form-actions">
				<button class="button" type="submit">
					{props.submitLabel}
				</button>
				<a class="button button-secondary" href={props.cancelHref}>
					Cancel
				</a>
			</div>
		</form>
	)
}
