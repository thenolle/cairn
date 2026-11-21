/** A comparable form of a path: forward slashes, and lower case where the file system ignores case. */
export function matchKey(path: string, caseInsensitive: boolean): string {
	const slashed = path.replaceAll('\\', '/')
	return caseInsensitive ? slashed.toLowerCase() : slashed
}

/** A folder key that ends with a slash, so `/games/a` never matches `/games/ab`. */
export function rootKey(path: string, caseInsensitive: boolean): string {
	const key = matchKey(path, caseInsensitive)
	return key.endsWith('/') ? key : `${key}/`
}
