import type { Database } from 'bun:sqlite'
import type { EmulatorProfile } from '../../../shared/emulators.ts'

interface EmulatorRow {
	readonly platform: string
	readonly name: string
	readonly executable: string
	readonly arguments: string
	readonly updated_at: number
}

const toProfile = (row: EmulatorRow): EmulatorProfile => ({
	platform: row.platform,
	name: row.name,
	executable: row.executable,
	arguments: row.arguments,
	updatedAt: row.updated_at
})

export class SqliteEmulatorRepository {
	private readonly selectAll
	private readonly selectOne
	private readonly upsert
	private readonly deleteOne

	constructor(database: Database) {
		this.selectAll = database.query<EmulatorRow, []>('SELECT platform, name, executable, arguments, updated_at FROM emulators ORDER BY platform')
		this.selectOne = database.query<EmulatorRow, { platform: string }>('SELECT platform, name, executable, arguments, updated_at FROM emulators WHERE platform = $platform')
		this.upsert = database.query<unknown, { platform: string; name: string; executable: string; arguments: string; updatedAt: number }>(`INSERT INTO emulators (platform, name, executable, arguments, updated_at) VALUES ($platform, $name, $executable, $arguments, $updatedAt) ON CONFLICT (platform) DO UPDATE SET name = excluded.name, executable = excluded.executable, arguments = excluded.arguments, updated_at = excluded.updated_at`)
		this.deleteOne = database.query<unknown, { platform: string }>('DELETE FROM emulators WHERE platform = $platform')
	}

	list(): readonly EmulatorProfile[] {
		return this.selectAll.all().map(toProfile)
	}

	find(platform: string): EmulatorProfile | null {
		const row = this.selectOne.get({ platform })
		return row === null ? null : toProfile(row)
	}

	save(profile: EmulatorProfile): void {
		this.upsert.run({
			platform: profile.platform,
			name: profile.name,
			executable: profile.executable,
			arguments: profile.arguments,
			updatedAt: profile.updatedAt
		})
	}

	remove(platform: string): boolean {
		return this.deleteOne.run({ platform }).changes > 0
	}
}
