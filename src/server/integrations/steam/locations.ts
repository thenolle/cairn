import { posix, win32 } from 'node:path'

export type Env = Readonly<Record<string, string | undefined>>

export interface SteamLocationInputs {
	readonly platform: string
	readonly env: Env
	readonly home: string
	readonly override: string | null
	readonly registryPath: string | null
}

/** Places where Steam is usually installed, most specific first. Callers check which one exists. */
export function steamRootCandidates(inputs: SteamLocationInputs): readonly string[] {
	const { platform, env, home, override, registryPath } = inputs
	const candidates: (string | null)[] = [override]

	if (platform === 'win32') {
		const programFiles86 = env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
		const programFiles = env['ProgramFiles'] ?? 'C:\\Program Files'
		candidates.push(
			registryPath === null ? null : win32.normalize(registryPath),
			win32.join(programFiles86, 'Steam'),
			win32.join(programFiles, 'Steam')
		)
	} else if (platform === 'darwin') {
		candidates.push(posix.join(home, 'Library', 'Application Support', 'Steam'))
	} else if (platform === 'linux') {
		candidates.push(
			posix.join(home, '.local', 'share', 'Steam'),
			posix.join(home, '.steam', 'steam'),
			posix.join(home, '.var', 'app', 'com.valvesoftware.Steam', '.local', 'share', 'Steam')
		)
	}

	const path = platform === 'win32' ? win32 : posix
	return [...new Set(candidates.filter((candidate): candidate is string => candidate !== null && path.isAbsolute(candidate)))]
}
