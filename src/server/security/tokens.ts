import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const tokenPattern = /^[A-Za-z0-9_-]{16,128}$/

/** Returns a URL-safe random token from the operating system's secure random source. */
export function randomToken(bytes = 32): string {
	return randomBytes(bytes).toString('base64url')
}

function sha256(value: string): Buffer {
	return createHash('sha256').update(value).digest()
}

/** Returns the hex SHA-256 digest used to store tokens without keeping them in clear. */
export function hashToken(token: string): string {
	return sha256(token).toString('hex')
}

/** Compares secrets in constant time so response timing does not reveal a partial match. */
export function tokensMatch(candidate: string, expected: string): boolean {
	return timingSafeEqual(sha256(candidate), sha256(expected))
}
