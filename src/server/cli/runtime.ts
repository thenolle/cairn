import type { Config } from '../config/config.ts'

/** The base URL of the runtime described by the configuration. */
export function runtimeOrigin(config: Pick<Config, 'host' | 'port'>): string {
	const host = config.host.includes(':') ? `[${config.host}]` : config.host
	return `http://${host}:${config.port}`
}

/** True when a runtime answers the health check at `origin`. */
export async function isRuntimeRunning(origin: string): Promise<boolean> {
	try {
		const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1500) })
		return response.ok
	} catch {
		return false
	}
}
