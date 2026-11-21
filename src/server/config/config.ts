import { homedir } from 'node:os'
import { isAbsolute, resolve } from 'node:path'
import { CairnError } from '../../shared/errors.ts'
import { logLevels } from '../logging/logger.ts'
import type { LogLevel } from '../logging/logger.ts'
import { resolveDirectories } from '../platform/paths.ts'
import type { Directories } from '../platform/paths.ts'

export const defaultHost = '127.0.0.1'
export const defaultPort = 17420

const loopbackHosts: readonly string[] = ['127.0.0.1', '::1', 'localhost']

export interface Config {
	readonly host: string
	readonly port: number
	readonly logLevel: LogLevel
	readonly development: boolean
	readonly clientDirectory: string
	readonly directories: Directories
	readonly steamPath: string | null
	readonly epicManifestsPath: string | null
}

export interface ConfigSource {
	readonly env?: Readonly<Record<string, string | undefined>>
	readonly platform?: string
	readonly home?: string
}

function parseAbsolutePath(name: string, raw: string | undefined): string | null {
	if (raw === undefined || raw === '') return null
	if (!isAbsolute(raw)) throw new CairnError('config_invalid', `${name} must be an absolute path.`)
	return raw
}

function parseHost(raw: string | undefined): string {
	if (raw === undefined || raw === '') return defaultHost
	if (!loopbackHosts.includes(raw)) {
		throw new CairnError('config_invalid', `CAIRN_HOST must be a loopback address: ${loopbackHosts.join(', ')}.`)
	}
	return raw
}

function parsePort(raw: string | undefined): number {
	if (raw === undefined || raw === '') return defaultPort
	const port = Number(raw)
	if (!Number.isInteger(port) || port < 1024 || port > 65535) {
		throw new CairnError('config_invalid', 'CAIRN_PORT must be an integer between 1024 and 65535.')
	}
	return port
}

function parseLogLevel(raw: string | undefined): LogLevel {
	if (raw === undefined || raw === '') return 'info'
	const level = logLevels.find((candidate) => candidate === raw)
	if (level === undefined) {
		throw new CairnError('config_invalid', `CAIRN_LOG_LEVEL must be one of: ${logLevels.join(', ')}.`)
	}
	return level
}

function parseClientDirectory(raw: string | undefined): string {
	return resolve(raw === undefined || raw === '' ? 'dist/client' : raw)
}

/** Reads the runtime configuration from environment variables. Throws a `CairnError` when a value is invalid. */
export function loadConfig(source: ConfigSource = {}): Config {
	const env = source.env ?? Bun.env
	return {
		host: parseHost(env['CAIRN_HOST']),
		port: parsePort(env['CAIRN_PORT']),
		logLevel: parseLogLevel(env['CAIRN_LOG_LEVEL']),
		development: env['NODE_ENV'] === 'development',
		clientDirectory: parseClientDirectory(env['CAIRN_CLIENT_DIR']),
		directories: resolveDirectories({
			platform: source.platform ?? process.platform,
			env,
			home: source.home ?? homedir()
		}),
		steamPath: parseAbsolutePath('CAIRN_STEAM_PATH', env['CAIRN_STEAM_PATH']),
		epicManifestsPath: parseAbsolutePath('CAIRN_EPIC_MANIFESTS', env['CAIRN_EPIC_MANIFESTS']),
	}
}
