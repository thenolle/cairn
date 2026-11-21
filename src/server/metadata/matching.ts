import { normalizeName } from '../../shared/library.ts'

/** The result whose name equals the wanted name, or the only result that starts with it. Anything uncertain is skipped. */
export function pickByName<T extends { readonly name: string }>(results: readonly T[], wanted: string): T | null {
	const key = normalizeName(wanted)
	if (key === '') return null
	const exact = results.find((result) => normalizeName(result.name) === key)
	if (exact !== undefined) return exact
	const prefixed = results.filter((result) => normalizeName(result.name).startsWith(key))
	return prefixed.length === 1 ? (prefixed[0] ?? null) : null
}
