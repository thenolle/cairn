import { mkdirSync } from 'node:fs'
import { loadConfig } from '../src/server/config/config.ts'
import { openDatabase, closeDatabase } from '../src/server/database/database.ts'
import { databaseLocations } from '../src/server/database/locations.ts'
import { migrate } from '../src/server/database/migrate.ts'
import { migrations } from '../src/server/database/migrations/index.ts'
import { SqliteGameRepository } from '../src/server/database/repositories/game-repository.ts'
import { transaction } from '../src/server/database/transaction.ts'
import { LibraryService } from '../src/server/library/library-service.ts'
import { platforms } from '../src/shared/library.ts'
import { CairnError } from '../src/shared/errors.ts'

if ((Bun.env['CAIRN_HOME'] ?? '') === '') {
	throw new CairnError('config_invalid', 'Set CAIRN_HOME to a development folder before seeding.')
}

const count = Number(process.argv[2] ?? '5000')
const words = ['Shadow', 'Ember', 'Hollow', 'Crown', 'Tide', 'Iron', 'Lantern', 'Orbit', 'Velvet', 'Rift', 'Harbor', 'Echo']
const pick = <T>(items: readonly T[], index: number): T => items[index % items.length] as T

const config = loadConfig()
mkdirSync(config.directories.data, { recursive: true })
const locations = databaseLocations(config.directories)
const database = openDatabase(locations.file)
migrate(database, migrations, { backupDirectory: locations.backups })
const library = new LibraryService(new SqliteGameRepository(database))

transaction(database, () => {
	for (let index = 0; index < count; index += 1) {
		library.add({
			name: `${pick(words, index)} ${pick(words, index * 7 + 3)} ${index}`,
			platform: pick(platforms, index).key
		})
	}
})

const time = (label: string, run: () => void): void => {
	const started = performance.now()
	run()
	console.log(`${label}: ${(performance.now() - started).toFixed(1)} ms`)
}

const base = { text: '', platform: null, favoritesOnly: false, sort: 'name', cursor: null } as const
time('first page', () => library.list(base))
time('search "shadow ember"', () => library.list({ ...base, text: 'shadow ember' }))
time('count', () => library.count(base))

let cursor: string | null = null
let pages = 0
const started = performance.now()
do {
	const page = library.list({ ...base, cursor })
	cursor = page.nextCursor
	pages += 1
} while (cursor !== null)
console.log(`${pages} pages walked in ${(performance.now() - started).toFixed(1)} ms`)

closeDatabase(database)
