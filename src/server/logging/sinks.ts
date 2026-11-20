import { createWriteStream, existsSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { LogSink } from './logger.ts'

export function createConsoleSink(): LogSink {
	return {
		write(record) {
			const hasFields = Object.keys(record.fields).length > 0
			const suffix = hasFields ? ` ${JSON.stringify(record.fields)}` : ''
			const line = `${record.time} ${record.level.toUpperCase().padEnd(5)} [${record.scope}] ${record.message}${suffix}`
			if (record.level === 'warn' || record.level === 'error') console.error(line)
			else console.log(line)
		},
		close: () => Promise.resolve()
	}
}

export interface FileSinkOptions {
	readonly directory: string
	readonly fileName?: string
	readonly maxBytes?: number
	readonly keep?: number
}

function rotate(target: string, maxBytes: number, keep: number): void {
	if (!existsSync(target) || statSync(target).size < maxBytes) return
	rmSync(`${target}.${keep}`, { force: true })
	for (let index = keep - 1; index >= 1; index -= 1) {
		const from = `${target}.${index}`
		if (existsSync(from)) renameSync(from, `${target}.${index + 1}`)
	}
	renameSync(target, `${target}.1`)
}

/** Appends one JSON record per line. Rotates at startup when the file exceeds `maxBytes`. */
export function createFileSink(options: FileSinkOptions): LogSink {
	const { directory, fileName = 'cairn.log', maxBytes = 5 * 1024 * 1024, keep = 3 } = options
	const target = join(directory, fileName)
	rotate(target, maxBytes, keep)

	const stream = createWriteStream(target, { flags: 'a', mode: 0o600 })
	stream.on('error', () => undefined)

	return {
		write(record) {
			stream.write(`${JSON.stringify(record)}\n`)
		},
		close: () => new Promise<void>((resolve) => stream.end(resolve))
	}
}
