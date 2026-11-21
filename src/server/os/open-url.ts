/** Opens a URL with the system's registered handler. Resolves to whether the request was accepted. */
export type UrlOpener = (url: string) => Promise<boolean>

const launchUrlPattern = new RegExp(
	'^(steam://rungameid/\\d{1,10}' +
		'|com\\.epicgames\\.launcher://apps/[\\w.-]{1,128}%3A[\\w.-]{1,128}%3A[\\w.-]{1,128}\\?action=launch&silent=true)$',
	'u'
)

const settleMs = 5000

/**
 * Only these exact URL shapes may be opened. Handing arbitrary text to the system opener could start
 * programs or open files, so anything else is refused.
 */
export function isAllowedLaunchUrl(url: string): boolean {
	return url.length <= 512 && launchUrlPattern.test(url)
}

function commandFor(platform: string, url: string): readonly string[] | null {
	if (platform === 'win32') return ['rundll32.exe', 'url.dll,FileProtocolHandler', url]
	if (platform === 'darwin') return ['open', url]
	if (platform === 'linux') return ['xdg-open', url]
	return null
}

export function createUrlOpener(platform: string): UrlOpener {
	return async (url) => {
		if (!isAllowedLaunchUrl(url)) return false
		const command = commandFor(platform, url)
		const executable = command === null ? null : Bun.which(command[0] ?? '')
		if (command === null || executable === null) return false

		try {
			const child = Bun.spawn([executable, ...command.slice(1)], { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' })
			let timer: ReturnType<typeof setTimeout> | undefined
			const result = await Promise.race([
				child.exited,
				new Promise<'running'>((resolve) => {
					timer = setTimeout(() => resolve('running'), settleMs)
				})
			])
			clearTimeout(timer)
			if (result === 'running') {
				child.unref()
				return true
			}
			return result === 0
		} catch {
			return false
		}
	}
}
