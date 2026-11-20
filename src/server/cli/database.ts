import { chmodSync, copyFileSync, existsSync, renameSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { appName } from '../../shared/app-info.ts'
import { CairnError } from '../../shared/errors.ts'
import { loadConfig } from '../config/config.ts'
import type { Config } from '../config/config.ts'
import { backupNamePattern, createBackup, listBackups } from '../database/backup.ts'
import { openDatabase } from '../database/database.ts'
import { databaseLocations } from '../database/locations.ts'
import type { DatabaseLocations } from '../database/locations.ts'
import { isRuntimeRunning, runtimeOrigin } from './runtime.ts'

const usage = 'Usage: bun run database <list | backup | restore <file>>'

function list(locations: DatabaseLocations): void {
	const names = listBackups(locations.backups)
	if (names.length === 0) {
		console.log('No backups found.')
		return
	}
	for (const name of names) {
		const kibibytes = Math.max(1, Math.round(statSync(join(locations.backups, name)).size / 1024))
		console.log(`${name}  ${kibibytes} KiB`)
	}
}

function backup(locations: DatabaseLocations): void {
	if (!existsSync(locations.file)) throw new CairnError('io_failed', 'There is no database to back up yet.')
	const database = openDatabase(locations.file)
	try {
		console.log(`Backup created: ${basename(createBackup(database, locations.backups, 'manual'))}`)
	} finally {
		database.close()
	}
}

async function restore(config: Config, locations: DatabaseLocations, name: string | undefined): Promise<void> {
	if (name === undefined || basename(name) !== name || !backupNamePattern.test(name)) {
		throw new CairnError('config_invalid', 'Provide the name of a backup file shown by "bun run database list".')
	}
	const source = join(locations.backups, name)
	if (!existsSync(source)) throw new CairnError('io_failed', 'That backup does not exist.')
	if (await isRuntimeRunning(runtimeOrigin(config))) {
		throw new CairnError('io_failed', `Stop ${appName} before restoring a backup.`)
	}

	const suffix = `.before-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`
	for (const extension of ['', '-wal', '-shm']) {
		const current = `${locations.file}${extension}`
		if (existsSync(current)) renameSync(current, `${locations.file}${suffix}${extension}`)
	}
	copyFileSync(source, locations.file)
	chmodSync(locations.file, 0o600)
	console.log(`Restored ${name}. The previous database was kept next to it with the suffix "${suffix}".`)
}

async function main(): Promise<void> {
	const [command, argument] = process.argv.slice(2)
	const config = loadConfig()
	const locations = databaseLocations(config.directories)

	switch (command) {
		case 'list':
			return list(locations)
		case 'backup':
			return backup(locations)
		case 'restore':
			return restore(config, locations, argument)
		default:
			throw new CairnError('config_invalid', usage)
	}
}

main().catch((error: unknown) => {
	if (error instanceof CairnError) console.error(`${appName}: ${error.message}`)
	else console.error(`${appName} could not complete the command`, error)
	process.exitCode = 1
})
