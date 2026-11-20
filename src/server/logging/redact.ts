import { CairnError } from '../../shared/errors.ts'

export type LogFields = Readonly<Record<string, unknown>>

export const redacted = '[redacted]'

const sensitiveKey = /token|secret|password|passphrase|authorization|cookie|credential|api[-_]?key|private[-_]?key/i
const maxDepth = 6

function serializeError(error: Error): Record<string, unknown> {
	const base = { name: error.name, message: error.message }
	return error instanceof CairnError ? { ...base, code: error.code } : base
}

/** Copies a value for logging, masking sensitive keys and bounding nesting depth. */
export function redact(value: unknown, depth = 0): unknown {
	if (value instanceof Error) return serializeError(value)
	if (value === null || value === undefined) return value
	if (typeof value === 'bigint') return value.toString()
	if (typeof value === 'function' || typeof value === 'symbol') return String(value)
	if (typeof value !== 'object') return value
	if (depth >= maxDepth) return '[truncated]'
	if (Array.isArray(value)) return value.map((item: unknown) => redact(item, depth + 1))

	const output: Record<string, unknown> = {}
	for (const [key, entry] of Object.entries(value)) {
		output[key] = sensitiveKey.test(key) ? redacted : redact(entry, depth + 1)
	}
	return output
}

export function redactFields(fields: LogFields): LogFields {
	return Object.fromEntries(
		Object.entries(fields).map(([key, entry]) => [key, sensitiveKey.test(key) ? redacted : redact(entry, 1)])
	)
}
