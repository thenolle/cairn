import { readdir, stat } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import type { CapabilityMap, CapabilityStatus } from '../../../shared/integrations.ts'
import type { InstallState } from '../../../shared/library.ts'
import type { Detection, DiscoveredGame, DiscoveryResult, LaunchPlan, PlatformAdapter } from '../adapter.ts'
import { steamRootCandidates } from './locations.ts'
import type { Env } from './locations.ts'
import { parseVdf, vdfObject, vdfString } from './vdf.ts'
import type { VdfObject } from './vdf.ts'
import { cleanGameName } from '../clean-name.ts'

export interface SteamAdapterOptions {
	readonly platform: string
	readonly env: Env
	readonly home: string
	readonly rootOverride: string | null
	readonly readRegistry: () => Promise<string | null>
}

const maxManifests = 5000
const maxFileBytes = 1_048_576
const manifestName = /^appmanifest_(\d{1,10})\.acf$/u
const ignoredAppIds: ReadonlySet<string> = new Set(['228980'])
const ignoredNamePrefixes: readonly string[] = ['Proton', 'Steam Linux Runtime']

const unsupported = (reason: string): CapabilityStatus => ({ supported: false, reason })

const managedBySteam = 'Steam handles this. Cairn only reads what is installed.'
const notAvailable = 'Not available yet.'

export const steamCapabilities: CapabilityMap = {
	discovery: { supported: true },
	installationDetection: { supported: true },
	metadata: unsupported('Artwork and descriptions come from metadata providers, which are not connected yet.'),
	launch: { supported: true },
	install: unsupported(managedBySteam),
	uninstall: unsupported(managedBySteam),
	update: unsupported(managedBySteam),
	configuration: unsupported(notAvailable),
	saveDiscovery: unsupported(notAvailable),
	saveBackup: unsupported(notAvailable),
	saveSync: unsupported(notAvailable)
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

function installStateOf(flags: number): InstallState {
	if (!Number.isInteger(flags)) return 'unknown'
	if ((flags & 4) !== 0) return 'installed'
	if ((flags & 1) !== 0) return 'not_installed'
	return 'unknown'
}

async function readLibraryPaths(root: string): Promise<readonly string[]> {
	const paths = [root]
	const text = await readSmallText(join(root, 'steamapps', 'libraryfolders.vdf'))
	if (text !== null) {
		try {
			const tree = parseVdf(text)
			const folders = vdfObject(tree, 'libraryfolders') ?? vdfObject(tree, 'LibraryFolders')
			for (const [key, entry] of Object.entries(folders ?? {})) {
				if (!/^\d+$/u.test(key)) continue
				const path = typeof entry === 'string' ? entry : vdfString(entry, 'path')
				if (path !== undefined && isAbsolute(path)) paths.push(path)
			}
		} catch {
			return paths
		}
	}
	const existing: string[] = []
	for (const path of [...new Set(paths)]) {
		if (await isDirectory(join(path, 'steamapps'))) existing.push(path)
	}
	return existing
}

function toGame(appId: string, state: VdfObject, library: string): DiscoveredGame | null {
	const name = cleanGameName(vdfString(state, 'name') ?? '')
	if (name === '' || ignoredAppIds.has(appId) || ignoredNamePrefixes.some((prefix) => name.startsWith(prefix))) return null
	const folder = vdfString(state, 'installdir')
	return {
		externalId: appId,
		name,
		platform: 'pc',
		installState: installStateOf(Number(vdfString(state, 'StateFlags') ?? '0')),
		installPath:folder !== undefined && folder !== '' && folder !== '.' && folder !== '..' && !/[\\/]/u.test(folder)? join(library, 'steamapps', 'common', folder): undefined
	}
}

/** Reads Steam's own library files. It never writes to Steam's folders. */
export function createSteamAdapter(options: SteamAdapterOptions): PlatformAdapter {
	const findRoot = async (): Promise<string | null> => {
		const registryPath = options.platform === 'win32' ? await options.readRegistry() : null
		const candidates = steamRootCandidates({
			platform: options.platform,
			env: options.env,
			home: options.home,
			override: options.rootOverride,
			registryPath
		})
		for (const candidate of candidates) {
			if (await isDirectory(join(candidate, 'steamapps'))) return candidate
		}
		return null
	}

	return {
		id: 'steam',
		name: 'Steam',
		capabilities: steamCapabilities,

		async prepareLaunch(externalId: string): Promise<LaunchPlan | null> {
			return /^\d{1,10}$/u.test(externalId) ? { kind: 'url', url: `steam://rungameid/${externalId}` } : null
		},

		async detect(): Promise<Detection> {
			const root = await findRoot()
			if (root === null) {
				return {
					status: 'not_found',
					message: 'Steam was not found. Install Steam, or set CAIRN_STEAM_PATH to its folder.',
					details: []
				}
			}
			const libraries = await readLibraryPaths(root)
			return {
				status: 'ready',
				message: 'Steam was found.',
				details: [{ label: 'Library folders', value: String(libraries.length) }]
			}
		},

		async discover(): Promise<DiscoveryResult> {
			const root = await findRoot()
			if (root === null) return { games: [], warnings: ['Steam was not found.'] }

			const warnings: string[] = []
			const games = new Map<string, DiscoveredGame>()
			let reachedLimit = false

			for (const library of await readLibraryPaths(root)) {
				const directory = join(library, 'steamapps')
				let names: string[]
				try {
					names = await readdir(directory)
				} catch {
					warnings.push('A Steam library folder could not be read.')
					continue
				}
				for (const name of names) {
					const match = manifestName.exec(name)
					const appId = match?.[1]
					if (appId === undefined) continue
					if (games.size >= maxManifests) {
						reachedLimit = true
						break
					}
					const text = await readSmallText(join(directory, name))
					let game: DiscoveredGame | null = null
					try {
						const tree = text === null ? undefined : parseVdf(text)
						const state = tree === undefined ? undefined : (vdfObject(tree, 'AppState') ?? vdfObject(tree, 'appstate'))
						if (state === undefined || vdfString(state, 'appid') !== appId) throw new Error('unexpected manifest')
						game = toGame(appId, state, library)
					} catch {
						warnings.push(`${name} could not be read.`)
						continue
					}
					const existing = games.get(appId)
					if (game !== null && existing?.installState !== 'installed') games.set(appId, game)
				}
			}
			if (reachedLimit) warnings.push(`Only the first ${maxManifests} games were read.`)
			return { games: [...games.values()], warnings }
		}
	}
}

/** Finds Steam's folder the same way the adapter does. */
export function createSteamRootFinder(options: SteamAdapterOptions): () => Promise<string | null> {
	return async () => {
		const registryPath = options.platform === 'win32' ? await options.readRegistry() : null
		const candidates = steamRootCandidates({
			platform: options.platform,
			env: options.env,
			home: options.home,
			override: options.rootOverride,
			registryPath
		})
		for (const candidate of candidates) {
			if (await isDirectory(join(candidate, 'steamapps'))) return candidate
		}
		return null
	}
}
