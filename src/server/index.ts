import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@gambrel/bun'
import type { ServerHandle } from '@gambrel/bun'
import { appName } from '../shared/app-info.ts'
import { CairnError } from '../shared/errors.ts'
import { loadConfig } from './config/config.ts'
import { closeDatabase, openDatabase } from './database/database.ts'
import { databaseLocations } from './database/locations.ts'
import { migrate } from './database/migrate.ts'
import { migrations } from './database/migrations/index.ts'
import { SqliteSessionStore } from './database/repositories/session-store.ts'
import { createHttpApp } from './http/app.ts'
import { createLogger } from './logging/logger.ts'
import { createConsoleSink, createFileSink } from './logging/sinks.ts'
import type { Directories } from './platform/paths.ts'
import { FailureLimiter } from './security/failure-limiter.ts'
import { PairingService } from './security/pairing.ts'
import { SessionService } from './security/sessions.ts'

function ensureDirectories(directories: Directories): void {
	for (const directory of Object.values(directories)) {
		mkdirSync(directory, { recursive: true, mode: 0o700 })
	}
}

function startServer(app: ReturnType<typeof createHttpApp>, host: string, port: number): ServerHandle {
	try {
		return serve(app, { hostname: host, port })
	} catch (error) {
		throw new CairnError('io_failed', `${appName} could not listen on ${host}:${port}. The port may already be in use.`, {
			cause: error
		})
	}
}

function main(): void {
	const config = loadConfig()
	ensureDirectories(config.directories)

	const sinks = [createConsoleSink(), createFileSink({ directory: config.directories.logs })]
	const logger = createLogger({ level: config.logLevel, sinks })

	const locations = databaseLocations(config.directories)
	const database = openDatabase(locations.file)
	const migration = migrate(database, migrations, { backupDirectory: locations.backups })
	if (migration.to !== migration.from) {
		logger.info('Database migrated', { from: migration.from, to: migration.to })
	}

	const sessions = new SessionService(new SqliteSessionStore(database))
	sessions.purgeExpired()

	const pairing = new PairingService({ filePath: join(config.directories.state, 'pairing.json') })
	const limiter = new FailureLimiter({ maxFailures: 5, windowMs: 60_000 })

	pairing.start()
	const server = startServer(createHttpApp({ pairing, sessions, limiter, logger }), config.host, config.port)
	logger.info(`${appName} runtime listening`, { url: server.url.href })

	let stopping = false
	const shutdown = async (): Promise<void> => {
		if (stopping) return
		stopping = true
		logger.info(`${appName} runtime stopping`)
		pairing.stop()
		await server.stop()
		closeDatabase(database)
		await Promise.all(sinks.map((sink) => sink.close()))
	}

	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.on(signal, () => {
			void shutdown()
		})
	}
}

try {
	main()
} catch (error: unknown) {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} failed to start`, error)
	process.exitCode = 1
}
