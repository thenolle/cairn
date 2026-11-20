import { posix, win32 } from 'node:path'
import { appName, appSlug } from '../../shared/app-info.ts'
import { CairnError } from '../../shared/errors.ts'

export interface Directories {
	readonly config: string
	readonly data: string
	readonly state: string
	readonly logs: string
	readonly cache: string
}

export interface PathInputs {
	readonly platform: string
	readonly env: Readonly<Record<string, string | undefined>>
	readonly home: string
}

type SupportedPlatform = 'win32' | 'darwin' | 'linux'
type PathImplementation = typeof posix

function isSupported(platform: string): platform is SupportedPlatform {
	return platform === 'win32' || platform === 'darwin' || platform === 'linux'
}

function layout(path: PathImplementation, root: string): Directories {
	const state = path.join(root, 'state')
	return {
		config: path.join(root, 'config'),
		data: path.join(root, 'data'),
		state,
		logs: path.join(state, 'logs'),
		cache: path.join(root, 'cache')
	}
}

function absoluteEnv(path: PathImplementation, env: PathInputs['env'], name: string): string | undefined {
	const value = env[name]
	return value !== undefined && value !== '' && path.isAbsolute(value) ? value : undefined
}

/**
 * Resolves where Cairn stores its files on the current platform.
 * Pure: every input is passed in, so each platform can be resolved from any host.
 * `CAIRN_HOME` places every directory under a single absolute root.
 */
export function resolveDirectories({ platform, env, home }: PathInputs): Directories {
	if (!isSupported(platform)) {
		throw new CairnError('platform_unsupported', `Platform "${platform}" is not supported.`)
	}

	const path = platform === 'win32' ? win32 : posix
	const override = env['CAIRN_HOME']

	if (override !== undefined && override !== '') {
		if (!path.isAbsolute(override)) {
			throw new CairnError('config_invalid', 'CAIRN_HOME must be an absolute path.')
		}
		return layout(path, override)
	}

	if (!path.isAbsolute(home)) {
		throw new CairnError('config_invalid', 'The home directory could not be determined.')
	}

	switch (platform) {
		case 'win32': {
			const base = absoluteEnv(path, env, 'LOCALAPPDATA') ?? path.join(home, 'AppData', 'Local')
			return layout(path, path.join(base, appName))
		}
		case 'darwin': {
			const root = path.join(home, 'Library', 'Application Support', appName)
			return { ...layout(path, root), cache: path.join(home, 'Library', 'Caches', appName) }
		}
		case 'linux': {
			const xdg = (name: string, fallback: string): string =>
				path.join(absoluteEnv(path, env, name) ?? path.join(home, fallback), appSlug)
			const state = xdg('XDG_STATE_HOME', '.local/state')
			return {
				config: xdg('XDG_CONFIG_HOME', '.config'),
				data: xdg('XDG_DATA_HOME', '.local/share'),
				state,
				logs: path.join(state, 'logs'),
				cache: xdg('XDG_CACHE_HOME', '.cache')
			}
		}
	}
}
