/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export interface SelectOption {
	readonly value: string
	readonly label: string
}

export interface SelectFieldProps {
	readonly name: string
	readonly label: string
	readonly options: readonly SelectOption[]
	readonly value: string
}

export function SelectField(props: SelectFieldProps): Child {
	return (
		<label class="field">
			<span class="field-label">{props.label}</span>
			<select name={props.name}>
				{props.options.map((option) =>
					option.value === props.value ? (
						<option value={option.value} selected>
							{option.label}
						</option>
					) : (
						<option value={option.value}>{option.label}</option>
					)
				)}
			</select>
		</label>
	)
}

export interface TextFieldProps {
	readonly name: string
	readonly label: string
	readonly type: 'text' | 'search'
	readonly value: string
	readonly required: boolean
	readonly maxLength: string
}

export function TextField(props: TextFieldProps): Child {
	return (
		<label class="field">
			<span class="field-label">{props.label}</span>
			{props.required ? (
				<input type={props.type} name={props.name} value={props.value} maxlength={props.maxLength} autocomplete="off" required />
			) : (
				<input type={props.type} name={props.name} value={props.value} maxlength={props.maxLength} autocomplete="off" />
			)}
		</label>
	)
}

export interface CheckboxFieldProps {
	readonly name: string
	readonly label: string
	readonly value: string
	readonly checked: boolean
}

export function CheckboxField(props: CheckboxFieldProps): Child {
	return (
		<label class="check">
			{props.checked ? (
				<input type="checkbox" name={props.name} value={props.value} checked />
			) : (
				<input type="checkbox" name={props.name} value={props.value} />
			)}
			<span>{props.label}</span>
		</label>
	)
}
