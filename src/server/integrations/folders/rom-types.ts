import { extname } from 'node:path'
import type { FolderPlatform } from '../../../shared/folders.ts'
import { cleanGameName } from '../clean-name.ts'

/** File extensions treated as games, per platform. Compared in lower case. */
export const romExtensions: Readonly<Record<FolderPlatform, ReadonlySet<string>>> = {
	'nintendo-switch': new Set(['.nsp', '.xci', '.nsz', '.xcz']),
	'nintendo-3ds': new Set(['.3ds', '.cia', '.cxi', '.3dsx']),
	'nintendo-ds': new Set(['.nds'])
}

/** A readable title from a file name: no extension, no `(region)` or `[tag]` groups, underscores as spaces. */
export function romTitle(fileName: string): string {
	const base = fileName.slice(0, fileName.length - extname(fileName).length)
	const cleaned = cleanGameName(base.replace(/\[[^\]]*\]|\([^)]*\)/gu, ' ').replace(/_/gu, ' '))
	return cleaned === '' ? cleanGameName(base) : cleaned
}
