export interface ReadFormOptions {
	readonly maxBytes?: number
	readonly multipart?: boolean
}

/**
 * Reads a form. Returns null when the body is missing, larger than `maxBytes`, or not a form of an
 * accepted kind. A `content-length` header is required so the size is known before anything is read.
 */
export async function readForm(request: Request, options: ReadFormOptions = {}): Promise<FormData | null> {
	const maxBytes = options.maxBytes ?? 4096
	const type = request.headers.get('content-type') ?? ''
	const accepted = type.startsWith('application/x-www-form-urlencoded') || (options.multipart === true && type.startsWith('multipart/form-data'))
	if (!accepted) return null
	const length = request.headers.get('content-length')
	if (length === null || !(Number(length) <= maxBytes)) return null
	try {
		return await request.formData()
	} catch {
		return null
	}
}
