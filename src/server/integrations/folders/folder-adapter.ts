import { readdir, stat } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { isFolderPlatform } from '../../../shared/folders.ts'
import type { LibraryFolder } from '../../../shared/folders.ts'
import type { CapabilityMap, CapabilityStatus } from '../../../shared/integrations.ts'
import { buildArguments } from '../../emulators/arguments.ts'
import type { Detection, DiscoveredGame, DiscoveryResult, LaunchPlan, PlatformAdapter } from '../adapter.ts'
import { romExtensions, romTitle } from './rom-types.ts'

export interface EmulatorChoice {
	readonly executable: string
	readonly arguments: string
}

export interface FolderAdapterOptions {
	readonly listFolders: () => readonly LibraryFolder[]
	readonly emulatorFor: (platform: string) => EmulatorChoice | null
}

const maxDepth = 6
const maxEntries = 200_000
const maxGames = 5000

const unsupported = (reason: string): CapabilityStatus => ({ supported: false, reason })
const filesAreYours = 'Cairn does not manage your files.'

export const folderCapabilities: CapabilityMap = {
	discovery: { supported: true },
	installationDetection: { supported: true },
	metadata: unsupported('Artwork and descriptions come from metadata providers, which are not connected yet.'),
	launch: { supported: true },
	install: unsupported(filesAreYours),
	uninstall: unsupported(filesAreYours),
	update: unsupported(filesAreYours),
	configuration: unsupported('Not available yet.'),
	saveDiscovery: unsupported('Not available yet.'),
	saveBackup: unsupported('Not available yet.'),
	saveSync: unsupported('Not available yet.')
}

interface Pending {
	readonly directory: string
	readonly relative: string
	readonly depth: number
}

async function isFile(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isFile()
	} catch {
		return false
	}
}

/** Finds game files in the folders you added and starts them with the emulator chosen for their platform. Files are never changed. */
export function createFolderAdapter(options: FolderAdapterOptions): PlatformAdapter {
	return {
		id: 'folders',
		name: 'Game folders',
		capabilities: folderCapabilities,

		async detect(): Promise<Detection> {
			const count = options.listFolders().length
			return { status: 'ready', message: count === 0 ? 'No game folders have been added yet.' : 'Game folders are ready to scan.', details: [{ label: 'Folders', value: String(count) }] }
		},

		async discover(): Promise<DiscoveryResult> {
			const warnings: string[] = []
			const games = new Map<string, DiscoveredGame>()
			let visited = 0
			for (const folder of options.listFolders()) {
				if (!isFolderPlatform(folder.platform)) continue
				const extensions = romExtensions[folder.platform]
				const stack: Pending[] = [{ directory: folder.path, relative: '', depth: 0 }]
				let unreadable = false
				while (stack.length > 0 && games.size < maxGames && visited < maxEntries) {
					const current = stack.pop()
					if (current === undefined) break
					let entries
					try {
						entries = await readdir(current.directory, { withFileTypes: true })
					} catch {
						unreadable = true
						continue
					}
					for (const entry of entries) {
						visited += 1
						if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue
						const relative = current.relative === '' ? entry.name : `${current.relative}/${entry.name}`
						if (entry.isDirectory()) {
							if (current.depth < maxDepth) stack.push({ directory: `${current.directory}/${entry.name}`, relative, depth: current.depth + 1 })
						} else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
							const name = romTitle(entry.name)
							if (name === '') continue
							const externalId = `${folder.id}/${relative}`
							games.set(externalId, { externalId, name, platform: folder.platform, installState: 'installed' })
						}
					}
				}
				if (unreadable) warnings.push('A game folder, or a folder inside it, could not be read.')
			}
			if (games.size >= maxGames) warnings.push(`Only the first ${maxGames} games were read.`)
			if (visited >= maxEntries) warnings.push('A folder was too large to read completely.')
			return { games: [...games.values()], warnings }
		},

		async prepareLaunch(externalId: string): Promise<LaunchPlan | null> {
			const slash = externalId.indexOf('/')
			if (slash <= 0) return null
			const folder = options.listFolders().find((candidate) => candidate.id === externalId.slice(0, slash))
			const parts = externalId.slice(slash + 1).split('/')
			if (folder === undefined || !isFolderPlatform(folder.platform)) return null
			if (parts.some((part) => part === '' || part === '.' || part === '..')) return null
			const file = join(folder.path, ...parts)
			if (!romExtensions[folder.platform].has(extname(file).toLowerCase()) || !(await isFile(file))) return null
			const emulator = options.emulatorFor(folder.platform)
			if (emulator === null) return { kind: 'problem', outcome: 'no_emulator' }
			const args = buildArguments(emulator.arguments, file)
			if (args === null) return { kind: 'problem', outcome: 'no_emulator' }
			return { kind: 'process', executable: emulator.executable, args, cwd: dirname(emulator.executable) }
		}
	}
}
