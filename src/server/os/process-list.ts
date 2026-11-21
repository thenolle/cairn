import { readdir, readFile, readlink } from 'node:fs/promises'

/** Lists executable paths (or command lines on macOS) of running processes. Throws when the list cannot be read. */
export type ProcessLister = () => Promise<readonly string[]>

const timeoutMs = 10_000
const windowsScript = '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath } | ForEach-Object { $_.ExecutablePath }'

async function capture(command: readonly string[]): Promise<string> {
	const executable = Bun.which(command[0] ?? '')
	if (executable === null) throw new Error('A required system tool was not found.')
	const child = Bun.spawn([executable, ...command.slice(1)], { stdin: 'ignore', stdout: 'pipe', stderr: 'ignore' })
	const timer = setTimeout(() => child.kill(), timeoutMs)
	try {
		const output = await new Response(child.stdout).text()
		if ((await child.exited) !== 0) throw new Error('The process list could not be read.')
		return output
	} finally {
		clearTimeout(timer)
	}
}

const lines = (text: string): string[] => text.replace(/^\ufeff/u, '').split(/\r?\n/u).filter((line) => line !== '')

async function linuxProcesses(): Promise<readonly string[]> {
	const pids = (await readdir('/proc')).filter((name) => /^\d+$/u.test(name))
	const found = await Promise.all(
		pids.map(async (pid) => {
			const result: string[] = []
			try {
				result.push((await readlink(`/proc/${pid}/exe`)).replace(/ \(deleted\)$/u, ''))
			} catch {
				// Not ours to read, or already gone.
			}
			try {
				for (const argument of (await readFile(`/proc/${pid}/cmdline`, 'utf8')).split('\0')) {
					if (/\.exe$/iu.test(argument)) result.push(argument.replaceAll('\\', '/').replace(/^[A-Za-z]:(?=\/)/u, ''))
				}
			} catch {
				// Not ours to read, or already gone.
			}
			return result
		})
	)
	return found.flat()
}

export function createProcessLister(platform: string): ProcessLister {
	if (platform === 'win32') return async () => lines(await capture(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', windowsScript]))
	if (platform === 'darwin') return async () => lines(await capture(['ps', '-axww', '-o', 'command=']))
	if (platform === 'linux') return linuxProcesses
	return () => Promise.resolve([])
}
