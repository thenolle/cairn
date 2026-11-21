/** Makes a launcher-provided title safe to store and show: no control characters, collapsed spaces, at most 200 characters. */
export function cleanGameName(raw: string): string {
	return raw.replace(/\p{Cc}/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, 200)
}
