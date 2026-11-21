import { existsSync, mkdirSync } from 'node:fs'
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
import { createRuntimeInfo } from './runtime-info.ts'
import { FailureLimiter } from './security/failure-limiter.ts'
import { PairingService } from './security/pairing.ts'
import { SessionService } from './security/sessions.ts'
import { SqliteGameRepository } from './database/repositories/game-repository.ts'
import { LibraryService } from './library/library-service.ts'
import { SqliteArtworkRepository } from './database/repositories/artwork-repository.ts'
import { ArtworkService } from './library/artwork-service.ts'
import { homedir } from 'node:os'
import { SqliteDiscoveryRepository } from './database/repositories/discovery-repository.ts'
import { IntegrationService } from './integrations/integration-service.ts'
import { createSteamAdapter } from './integrations/steam/steam-adapter.ts'
import { readSteamRegistryPath } from './integrations/steam/windows-registry.ts'
import { createEpicAdapter } from './integrations/epic/epic-adapter.ts'
import { SqliteFolderRepository } from './database/repositories/folder-repository.ts'
import { createFolderAdapter } from './integrations/folders/folder-adapter.ts'
import { FolderService } from './library/folder-service.ts'
import { SqliteCollectionRepository } from './database/repositories/collection-repository.ts'
import { CollectionService } from './library/collection-service.ts'
import { LaunchService } from './launching/launch-service.ts'
import { createUrlOpener } from './os/open-url.ts'
import { ActivityService } from './activity/activity-service.ts'
import { SqliteActivityRepository } from './database/repositories/activity-repository.ts'
import { createProcessLister } from './os/process-list.ts'
import { SqliteEmulatorRepository } from './database/repositories/emulator-repository.ts'
import { EmulatorService } from './emulators/emulator-service.ts'
import { startProcess } from './os/start-process.ts'

function ensureDirectories(directories: Directories): void {
	for (const directory of Object.values(directories)) {
		mkdirSync(directory, { recursive: true, mode: 0o700 })
	}
}

function startServer(app: ReturnType<typeof createHttpApp>, host: string, port: number): ServerHandle {
	try {
		return serve(app, { hostname: host, port })
	} catch (error) {
		throw new CairnError('io_failed', `${appName} could not listen on ${host}:${port}. The port may already be in use.`, { cause: error })
	}
}

function main(): void {
	const config = loadConfig()
	ensureDirectories(config.directories)
	const sinks = [createConsoleSink(), createFileSink({ directory: config.directories.logs })]
	const logger = createLogger({ level: config.logLevel, sinks })
	if (!existsSync(join(config.clientDirectory, 'client.js'))) logger.warn('Interface files were not found. Build them with "bun run build" or set CAIRN_CLIENT_DIR.')
	const locations = databaseLocations(config.directories)
	const database = openDatabase(locations.file)
	const migration = migrate(database, migrations, { backupDirectory: locations.backups })
	if (migration.to !== migration.from) logger.info('Database migrated', { from: migration.from, to: migration.to })
	const sessions = new SessionService(new SqliteSessionStore(database))
	sessions.purgeExpired()
	const pairing = new PairingService({ filePath: join(config.directories.state, 'pairing.json') })
	const limiter = new FailureLimiter({ maxFailures: 5, windowMs: 60_000 })
	const host = config.host.includes(':') ? `[${config.host}]` : config.host
	const runtime = createRuntimeInfo({ schemaVersion: migration.to, address: `${host}:${config.port}` })
	const games = new SqliteGameRepository(database)
	const folders = new FolderService(new SqliteFolderRepository(database), { caseInsensitive: process.platform === 'win32' || process.platform === 'darwin' })
	const collections = new CollectionService(new SqliteCollectionRepository(database))
	const emulators = new EmulatorService(new SqliteEmulatorRepository(database), { platform: process.platform })
	const adapters = [
		createSteamAdapter({ platform: process.platform, env: Bun.env, home: homedir(), rootOverride: config.steamPath, readRegistry: readSteamRegistryPath }),
		createEpicAdapter({ platform: process.platform, env: Bun.env, manifestsOverride: config.epicManifestsPath }),
		createFolderAdapter({ listFolders: () => folders.list(), emulatorFor: (platform) => emulators.get(platform) }),
	]
	const integrations = new IntegrationService({ adapters, repository: new SqliteDiscoveryRepository(database, games), logger: logger.child('integrations') })
	pairing.start()
	integrations.scanReady()
	const library = new LibraryService(games)
	const activity = new ActivityService({ repository: new SqliteActivityRepository(database), listProcesses: createProcessLister(process.platform), logger: logger.child('activity'), caseInsensitive: process.platform === 'win32' || process.platform === 'darwin' })
	activity.start()
	const launcher = new LaunchService({ library, adapters, opener: createUrlOpener(process.platform), starter: startProcess, activity, platform: process.platform, logger: logger.child('launcher') })
	const artwork = new ArtworkService(new SqliteArtworkRepository(database), join(config.directories.data, 'media'))
	const server = startServer(createHttpApp({ pairing, sessions, limiter, logger, runtime, library, integrations, folders, collections, launcher, activity, emulators, artwork, clientDirectory: config.clientDirectory, development: config.development }), config.host, config.port)
	logger.info(`${appName} runtime listening`, { url: server.url.href })
	let stopping = false
	const shutdown = async (): Promise<void> => {
		if (stopping) return
		stopping = true
		logger.info(`${appName} runtime stopping`)
		pairing.stop()
		activity.stop()
		await server.stop()
		closeDatabase(database)
		await Promise.all(sinks.map((sink) => sink.close()))
	}
	for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void shutdown() })
}

try {
	main()
} catch (error: unknown) {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} failed to start`, error)
	process.exitCode = 1
}
