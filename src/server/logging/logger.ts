import { redactFields } from './redact.ts'
import type { LogFields } from './redact.ts'

export const logLevels = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof logLevels)[number]

export interface LogRecord {
	readonly time: string
	readonly level: LogLevel
	readonly scope: string
	readonly message: string
	readonly fields: LogFields
}

export interface LogSink {
	write(record: LogRecord): void
	close(): Promise<void>
}

export interface Logger {
	debug(message: string, fields?: LogFields): void
	info(message: string, fields?: LogFields): void
	warn(message: string, fields?: LogFields): void
	error(message: string, fields?: LogFields): void
	child(scope: string): Logger
}

export interface LoggerOptions {
	readonly level: LogLevel
	readonly sinks: readonly LogSink[]
	readonly scope?: string
}

const rank: Readonly<Record<LogLevel, number>> = { debug: 10, info: 20, warn: 30, error: 40 }

/** Creates a logger that redacts sensitive fields and never throws because of a failing sink. */
export function createLogger(options: LoggerOptions): Logger {
	const { level, sinks, scope = 'cairn' } = options

	const emit = (severity: LogLevel, message: string, fields: LogFields = {}): void => {
		if (rank[severity] < rank[level]) return
		const record: LogRecord = {
			time: new Date().toISOString(),
			level: severity,
			scope,
			message,
			fields: redactFields(fields)
		}
		for (const sink of sinks) {
			try {
				sink.write(record)
			} catch {
				continue
			}
		}
	}

	return {
		debug: (message, fields) => emit('debug', message, fields),
		info: (message, fields) => emit('info', message, fields),
		warn: (message, fields) => emit('warn', message, fields),
		error: (message, fields) => emit('error', message, fields),
		child: (childScope) => createLogger({ level, sinks, scope: `${scope}.${childScope}` })
	}
}
