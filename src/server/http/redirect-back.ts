/**
 * The same-site path a request came from, or `fallback`. Only the path and query of a same-host
 * referrer are used, and paths that browsers treat as another site (starting with `//`) are refused.
 */
export function backTarget(request: Request, fallback: string): string {
	const referer = request.headers.get('referer')
	if (referer === null) return fallback
	try {
		const from = new URL(referer)
		if (from.host !== new URL(request.url).host) return fallback
		const target = `${from.pathname}${from.search}`
		return target.startsWith('/') && !target.startsWith('//') ? target : fallback
	} catch {
		return fallback
	}
}
