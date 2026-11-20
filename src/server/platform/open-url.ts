import { CairnError } from '../../shared/errors.ts'

const loopbackHostnames: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

function browserCommand(platform: string, url: string): readonly string[] {
	switch (platform) {
		case 'win32': return ['rundll32', 'url.dll,FileProtocolHandler', url]
		case 'darwin': return ['open', url]
		case 'linux': return ['xdg-open', url]
		default: throw new CairnError('platform_unsupported', `Platform "${platform}" is not supported.`)
	}
}

/** Opens a loopback http URL in the default browser. Arguments are passed directly, never through a shell. */
export async function openUrl(url: string, platform: string = process.platform): Promise<void> {
	const parsed = new URL(url)
	if (parsed.protocol !== 'http:' || !loopbackHostnames.has(parsed.hostname)) {
		throw new CairnError('config_invalid', 'Only loopback http URLs can be opened.')
	}
	const child = Bun.spawn([...browserCommand(platform, parsed.href)], {
		stdin: 'ignore',
		stdout: 'ignore',
		stderr: 'ignore'
	})
	if ((await child.exited) !== 0) {
		throw new CairnError('io_failed', 'The default browser could not be opened.')
	}
}
