import { mkdirSync } from 'node:fs'
import { appName } from '../shared/app-info.ts'
import { CairnError } from '../shared/errors.ts'
import { loadConfig } from './config/config.ts'
import { createLogger } from './logging/logger.ts'
import { createConsoleSink, createFileSink } from './logging/sinks.ts'
import type { Directories } from './platform/paths.ts'

function ensureDirectories(directories: Directories): void {
	for (const directory of Object.values(directories)) {
		mkdirSync(directory, { recursive: true, mode: 0o700 })
	}
}

async function main(): Promise<void> {
	const config = loadConfig()
	ensureDirectories(config.directories)

	const fileSink = createFileSink({ directory: config.directories.logs })
	const consoleSink = createConsoleSink()
	const logger = createLogger({ level: config.logLevel, sinks: [consoleSink, fileSink] })

	logger.info(`${appName} runtime initialised`, { host: config.host, port: config.port })
	logger.debug('Resolved directories', { ...config.directories })

	await Promise.all([consoleSink.close(), fileSink.close()])
}

main().catch((error: unknown) => {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} failed to start`, error)
	process.exitCode = 1
})
