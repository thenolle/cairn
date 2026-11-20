/** Reads a small URL-encoded form. Returns null when the body is missing, too large or not a form. */
export async function readForm(request: Request, maxBytes = 4096): Promise<FormData | null> {
	const type = request.headers.get('content-type') ?? ''
	if (!type.startsWith('application/x-www-form-urlencoded')) return null
	const length = request.headers.get('content-length')
	if (length === null || !(Number(length) <= maxBytes)) return null
	try {
		return await request.formData()
	} catch {
		return null
	}
}
