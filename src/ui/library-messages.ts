const messages: Readonly<Record<string, string>> = {
	name_required: 'Enter a name for the game.',
	name_too_long: 'Game names can have at most 200 characters.',
	platform_invalid: 'Choose a platform from the list.'
}

/** The text for a form error code, or null when the code is unknown. */
export function errorMessage(code: string | null): string | null {
	return code === null ? null : (messages[code] ?? null)
}
