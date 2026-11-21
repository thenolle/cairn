const messages: Readonly<Record<string, string>> = {
	name_required: 'Enter a name for the game.',
	name_too_long: 'Game names can have at most 200 characters.',
	platform_invalid: 'Choose a platform from the list.',
	file_missing: 'Choose an image file to upload.',
	file_too_large: 'Images can be up to 8 MB.',
	file_type_invalid: 'Use a PNG, JPEG or WebP image.',
	upload_unreadable: 'The upload could not be read. Images can be up to 8 MB.',
	kind_invalid: 'Unknown image type.'
}

/** The text for a form error code, or null when the code is unknown. */
export function errorMessage(code: string | null): string | null {
	return code === null ? null : (messages[code] ?? null)
}
