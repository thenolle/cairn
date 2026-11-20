import { join } from 'node:path'
import { appName } from '../../shared/app-info.ts'
import { CairnError } from '../../shared/errors.ts'
import { loadConfig } from '../config/config.ts'
import { openUrl } from '../platform/open-url.ts'
import { readPairingFile } from '../security/pairing.ts'
import { isRuntimeRunning, runtimeOrigin } from './runtime.ts'

async function main(): Promise<void> {
	const config = loadConfig()
	const origin = runtimeOrigin(config)

	if (!(await isRuntimeRunning(origin))) {
		throw new CairnError('io_failed', `${appName} is not running. Start it first.`)
	}

	const pairing = readPairingFile(join(config.directories.state, 'pairing.json'))
	if (pairing === null || pairing.expiresAt <= Date.now()) {
		throw new CairnError('io_failed', 'No pairing code was found. If the runtime was started with CAIRN_HOME, set the same value for this command.')
	}

	await openUrl(`${origin}/pair?code=${pairing.code}`)
}

main().catch((error: unknown) => {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} could not open the interface`, error)
	process.exitCode = 1
})
