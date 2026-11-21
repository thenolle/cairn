import { readdir, stat } from 'node:fs/promises'
import { isAbsolute, join, win32 } from 'node:path'
import type { CapabilityMap, CapabilityStatus } from '../../../shared/integrations.ts'
import type { InstallState } from '../../../shared/library.ts'
import type { Detection, DiscoveredGame, DiscoveryResult, PlatformAdapter } from '../adapter.ts'
import { cleanGameName } from '../clean-name.ts'

export interface EpicAdapterOptions {
	readonly platform: string
	readonly env: Readonly<Record<string, string | undefined>>
	readonly manifestsOverride: string | null
}

const maxManifests = 5000
const maxFileBytes = 1_048_576
const appNamePattern = /^[\w.-]{1,128}$/u

const unsupported = (reason: string): CapabilityStatus => ({ supported: false, reason })
const managedByEpic = 'The Epic Games Launcher handles this. Cairn only reads what is installed.'
const notAvailable = 'Not available yet.'

export const epicCapabilities: CapabilityMap = {
	discovery: { supported: true },
	installationDetection: { supported: true },
	metadata: unsupported('Artwork and descriptions come from metadata providers, which are not connected yet.'),
	launch: unsupported(notAvailable),
	install: unsupported(managedByEpic),
	uninstall: unsupported(managedByEpic),
	update: unsupported(managedByEpic),
	configuration: unsupported(notAvailable),
	saveDiscovery: unsupported(notAvailable),
	saveBackup: unsupported(notAvailable),
	saveSync: unsupported(notAvailable)
}

function manifestsFolder(options: EpicAdapterOptions): string | null {
	if (options.manifestsOverride !== null) return options.manifestsOverride
	if (options.platform !== 'win32') return null
	return win32.join(options.env['ProgramData'] ?? 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
}

async function isDirectory(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isDirectory()
	} catch {
		return false
	}
}

async function readSmallText(path: string): Promise<string | null> {
	try {
		const file = Bun.file(path)
		return file.size > maxFileBytes ? null : await file.text()
	} catch {
		return null
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key]
	return typeof value === 'string' ? value : undefined
}

async function toGame(record: Record<string, unknown>): Promise<DiscoveredGame | null> {
	const appName = readString(record, 'AppName')
	const name = cleanGameName(readString(record, 'DisplayName') ?? '')
	if (appName === undefined || !appNamePattern.test(appName) || name === '') return null

	const mainGame = readString(record, 'MainGameAppName')
	if (mainGame !== undefined && mainGame !== appName) return null
	if (record['bIsApplication'] === false) return null

	let installState: InstallState = record['bIsIncompleteInstall'] === true ? 'unknown' : 'installed'
	const location = readString(record, 'InstallLocation')
	if (installState === 'installed' && location !== undefined && isAbsolute(location) && !(await isDirectory(location))) {
		installState = 'not_installed'
	}
	return { externalId: appName, name, platform: 'pc', installState }
}

/** Reads the manifests the Epic Games Launcher writes for installed games. It never writes to them. */
export function createEpicAdapter(options: EpicAdapterOptions): PlatformAdapter {
	const itemFiles = async (folder: string): Promise<string[]> => {
		try {
			return (await readdir(folder)).filter((name) => name.endsWith('.item'))
		} catch {
			return []
		}
	}

	return {
		id: 'epic',
		name: 'Epic Games',
		capabilities: epicCapabilities,

		async detect(): Promise<Detection> {
			const folder = manifestsFolder(options)
			if (folder === null) {
				return {
					status: 'unsupported_platform',
					message:
						'Cairn only knows where the Epic Games Launcher keeps its data on Windows. Set CAIRN_EPIC_MANIFESTS to its Manifests folder to use another location.',
					details: []
				}
			}
			if (!(await isDirectory(folder))) {
				return {
					status: 'not_found',
					message: 'The Epic Games Launcher data was not found. Install it and sign in once, or set CAIRN_EPIC_MANIFESTS.',
					details: []
				}
			}
			return {
				status: 'ready',
				message: 'The Epic Games Launcher data was found. Only installed games can be discovered.',
				details: [{ label: 'Manifests', value: String((await itemFiles(folder)).length) }]
			}
		},

		async discover(): Promise<DiscoveryResult> {
			const folder = manifestsFolder(options)
			if (folder === null) return { games: [], warnings: ['The Epic Games Launcher data was not found.'] }

			const warnings: string[] = []
			const games = new Map<string, DiscoveredGame>()
			for (const name of await itemFiles(folder)) {
				if (games.size >= maxManifests) {
					warnings.push(`Only the first ${maxManifests} games were read.`)
					break
				}
				const text = await readSmallText(join(folder, name))
				try {
					const parsed: unknown = text === null ? null : JSON.parse(text)
					if (!isRecord(parsed)) throw new Error('unexpected manifest')
					const game = await toGame(parsed)
					if (game !== null) games.set(game.externalId, game)
				} catch {
					warnings.push(`${name} could not be read.`)
				}
			}
			return { games: [...games.values()], warnings }
		}
	}
}
