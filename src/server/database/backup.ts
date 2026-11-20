import { chmodSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { Database } from 'bun:sqlite'
import { CairnError } from '../../shared/errors.ts'

export const backupNamePattern = /^cairn-[a-z]+(?:-[a-z]+)*-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sqlite$/

const labelPattern = /^[a-z]+(?:-[a-z]+)*$/

/** Writes a consistent copy of the database into `directory` and returns its path. */
export function createBackup(database: Database, directory: string, label: string, now: number = Date.now()): string {
	if (!labelPattern.test(label)) throw new CairnError('config_invalid', 'Backup labels use lowercase letters and hyphens.')
	mkdirSync(directory, { recursive: true, mode: 0o700 })
	const stamp = new Date(now).toISOString().replace(/[:.]/g, '-')
	const target = join(directory, `cairn-${label}-${stamp}.sqlite`)
	if (existsSync(target)) throw new CairnError('io_failed', 'A backup with this name already exists.')
	database.run('VACUUM INTO ?', [target])
	chmodSync(target, 0o600)
	return target
}

/** Backup file names, newest first. */
export function listBackups(directory: string): readonly string[] {
	if (!existsSync(directory)) return []
	return readdirSync(directory)
		.filter((name) => backupNamePattern.test(name))
		.sort()
		.reverse()
}

/** Deletes all but the newest `keep` backups that carry `label`. */
export function pruneBackups(directory: string, label: string, keep: number): void {
	const prefix = `cairn-${label}-`
	for (const name of listBackups(directory).filter((candidate) => candidate.startsWith(prefix)).slice(keep)) {
		rmSync(join(directory, name), { force: true })
	}
}
