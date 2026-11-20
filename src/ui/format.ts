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
