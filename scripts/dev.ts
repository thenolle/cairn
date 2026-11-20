import { join } from 'node:path'
import { buildClient, loadConfig } from '@gambrel/compiler'
import { buildAssets } from './assets.ts'

const root = join(import.meta.dir, '..')
await buildClient({ root, config: await loadConfig(root), mode: 'development' })
await buildAssets(root)

const server = Bun.spawn([process.execPath, '--watch', 'src/server/index.ts'], {
	cwd: root,
	stdio: ['inherit', 'inherit', 'inherit'],
	env: { ...process.env, NODE_ENV: 'development' }
})
process.on('SIGINT', () => server.kill())
await server.exited
