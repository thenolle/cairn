export const sessionCookieName = 'cairn_session'

export function readCookie(header: string | null, name: string): string | undefined {
	if (header === null) return undefined
	for (const part of header.split(';')) {
		const index = part.indexOf('=')
		if (index === -1) continue
		if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim()
	}
	return undefined
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
	return `${sessionCookieName}=${token}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Strict`
}
