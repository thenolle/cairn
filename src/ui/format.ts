/** Formats a duration in seconds as its two largest units, for example `3 h 5 min`. */
export function formatDuration(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds))
	const days = Math.floor(seconds / 86_400)
	const hours = Math.floor((seconds % 86_400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	if (days > 0) return `${days} d ${hours} h`
	if (hours > 0) return `${hours} h ${minutes} min`
	if (minutes > 0) return `${minutes} min ${seconds % 60} s`
	return `${seconds} s`
}

/** Formats an ISO timestamp as UTC text that renders identically on the server and in the browser. */
export function formatTimestamp(iso: string): string {
	return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`
}

/** Up to two uppercase initials from a game name, used when there is no artwork. */
export function initials(name: string): string {
	const words = name.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '')
	return words
		.slice(0, 2)
		.map((word) => word.charAt(0).toUpperCase())
		.join('')
}

/** Formats a timestamp in milliseconds as a UTC date. */
export function formatDate(milliseconds: number): string {
	return new Date(milliseconds).toISOString().slice(0, 10)
}

/** Formats played time, or says that none is recorded. */
export function formatPlaytime(seconds: number): string {
	if (seconds <= 0) return 'No playtime recorded'
	return formatDuration(seconds)
}

/** A stable color class for a game, used by tiles and heroes that have no artwork. */
export function hueClass(name: string): string {
let hash = 0
for (const character of name) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0
return `hue-${hash % 12}`
}
