import { json } from '@gambrel/core'

export function errorResponse(status: number, code: string, message: string, headers?: HeadersInit): Response {
	return json({ error: { code, message } }, headers === undefined ? { status } : { status, headers })
}
