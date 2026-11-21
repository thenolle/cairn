import { createHash } from 'node:crypto'
import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { renderIcons } from './icons.ts'

const stylesheets = ['tokens.css', 'base.css', 'shell.css', 'pages.css', 'library.css', 'home.css', 'browse.css']

const precache = [
	'/offline',
	'/assets/app.css',
	'/assets/client.js',
	'/assets/favicon.svg',
	'/assets/icons/icon-192.png',
	'/assets/icons/icon-512.png'
]

async function writeServiceWorker(root: string, clientDirectory: string): Promise<void> {
	const hash = createHash('sha256')
	for (const url of precache.filter((entry) => entry.startsWith('/assets/'))) {
		hash.update(await Bun.file(join(clientDirectory, url.slice('/assets/'.length))).bytes())
	}
	const template = await Bun.file(join(root, 'src', 'ui', 'sw', 'template.js')).text()
	const script = template
		.replace('__CACHE_ID__', hash.digest('hex').slice(0, 12))
		.replace('__PRECACHE__', JSON.stringify(precache))
	await Bun.write(join(clientDirectory, 'sw.js'), script)
}

/** Writes the stylesheet, static files, icons and service worker next to the browser bundle. */
export async function buildAssets(root: string): Promise<void> {
	const clientDirectory = join(root, 'dist', 'client')
	const styles = await Promise.all(stylesheets.map((name) => Bun.file(join(root, 'src', 'ui', 'styles', name)).text()))
	await Bun.write(join(clientDirectory, 'app.css'), `${styles.join('\n')}\n`)
	await cp(join(root, 'src', 'ui', 'assets'), clientDirectory, { recursive: true })
	await renderIcons(join(clientDirectory, 'icons'))
	await writeServiceWorker(root, clientDirectory)
}
