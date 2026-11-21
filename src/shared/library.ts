export const platforms = [
	{ key: 'pc', label: 'PC' },
	{ key: 'nintendo-switch', label: 'Nintendo Switch' },
	{ key: 'nintendo-3ds', label: 'Nintendo 3DS' },
	{ key: 'nintendo-ds', label: 'Nintendo DS' },
	{ key: 'other', label: 'Other' }
] as const

export type PlatformKey = (typeof platforms)[number]['key']

export const installStates = [
	{ key: 'installed', label: 'Installed' },
	{ key: 'not_installed', label: 'Not installed' },
	{ key: 'unknown', label: 'Not verified' }
] as const

export type InstallState = (typeof installStates)[number]['key']

export type GameSort = 'name' | 'added'

export interface Game {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly source: string
	readonly sourceId: string | null
	readonly installState: InstallState
	readonly favorite: boolean
	readonly playtimeSeconds: number
	readonly lastPlayedAt: number | null
	readonly createdAt: number
	readonly updatedAt: number
}

export interface GameFilter {
	readonly text: string
	readonly platform: string | null
	readonly favoritesOnly: boolean
}

export interface GameQuery extends GameFilter {
	readonly sort: GameSort
	readonly cursor: string | null
	readonly limit?: number
}

export interface GamePage {
	readonly games: readonly Game[]
	readonly nextCursor: string | null
}

export function isPlatformKey(value: string): value is PlatformKey {
	return platforms.some((platform) => platform.key === value)
}

export function isInstallState(value: string): value is InstallState {
	return installStates.some((state) => state.key === value)
}

export function platformLabel(key: string): string {
	return platforms.find((platform) => platform.key === key)?.label ?? key
}

export function installStateLabel(key: string): string {
	return installStates.find((state) => state.key === key)?.label ?? key
}

/** Lowercases, removes accents and collapses whitespace so names sort and match consistently. */
export function normalizeName(value: string): string {
	return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim()
}

/** Splits search text into normalized words. Only the first `max` words are used. */
export function searchTokens(text: string, max = 5): readonly string[] {
	return normalizeName(text).split(' ').filter((token) => token !== '').slice(0, max)
}

/** The name shown for where a game came from. */
export function sourceLabel(source: string): string {
	if (source === 'manual') return 'Added manually'
	if (source === 'steam') return 'Steam'
	if (source === 'epic') return 'Epic Games'
	if (source === 'folders') return 'Game folder'
	return source
}
