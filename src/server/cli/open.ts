import { join } from 'node:path'
import { appName } from '../../shared/app-info.ts'
import { CairnError } from '../../shared/errors.ts'
import { loadConfig } from '../config/config.ts'
import { openUrl } from '../platform/open-url.ts'
import { readPairingFile } from '../security/pairing.ts'

async function main(): Promise<void> {
	const config = loadConfig()
	const host = config.host.includes(':') ? `[${config.host}]` : config.host
	const origin = `http://${host}:${config.port}`

	try {
		const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(2000) })
		if (!response.ok) throw new Error('unhealthy')
	} catch {
		throw new CairnError('io_failed', `${appName} is not running. Start it first.`)
	}

	const pairing = readPairingFile(join(config.directories.state, 'pairing.json'))
	if (pairing === null || pairing.expiresAt <= Date.now()) {
		throw new CairnError('io_failed', 'No valid pairing code is available. Try again in a moment.')
	}

	await openUrl(`${origin}/pair?code=${pairing.code}`)
}

main().catch((error: unknown) => {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} could not open the interface`, error)
	process.exitCode = 1
})
