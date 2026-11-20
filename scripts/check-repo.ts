/**
 * Verifies that the files every Cairn contributor and user relies on are present.
 * Run with `bun run check`.
 */
const required = [
	'README.md',
	'LICENSE',
	'SECURITY.md',
	'CONTRIBUTING.md',
	'CHANGELOG.md',
	'.editorconfig',
	'.gitattributes',
	'.bun-version',
	'.github/CODEOWNERS'
]

const missing: string[] = []

for (const path of required) {
	if (!(await Bun.file(path).exists())) missing.push(path)
}

if (missing.length > 0) {
	console.error(`Missing required files:\n${missing.map((path) => `  - ${path}`).join('\n')}`)
	process.exit(1)
}

console.log(`All ${required.length} required files are present.`)
