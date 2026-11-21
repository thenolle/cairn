import { win32 } from 'node:path'
import type { LaunchPlan } from '../adapter.ts'

const maxFileBytes = 1_048_576
const idPattern = /^[\w.-]{1,128}$/u

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readId(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key]
	return typeof value === 'string' && idPattern.test(value) ? value : undefined
}

/**
 * Builds the Epic launcher link for an installed game from the launcher's list of installations.
 * The namespace, item and artifact ids all have to be present and well formed.
 */
export async function epicLaunchPlan(env: Readonly<Record<string, string | undefined>>, appName: string): Promise<LaunchPlan | null> {
	const path = win32.join(env['ProgramData'] ?? 'C:\\ProgramData', 'Epic', 'UnrealEngineLauncher', 'LauncherInstalled.dat')
	try {
		const file = Bun.file(path)
		if (file.size > maxFileBytes) return null
		const parsed: unknown = JSON.parse(await file.text())
		const list = isRecord(parsed) ? parsed['InstallationList'] : undefined
		if (!Array.isArray(list)) return null
		for (const entry of list as unknown[]) {
			if (!isRecord(entry)) continue
			const artifact = readId(entry, 'ArtifactId') ?? readId(entry, 'AppName')
			const namespace = readId(entry, 'NamespaceId')
			const item = readId(entry, 'ItemId')
			if (artifact !== appName || namespace === undefined || item === undefined) continue
			return { kind: 'url', url: `com.epicgames.launcher://apps/${namespace}%3A${item}%3A${artifact}?action=launch&silent=true` }
		}
	} catch {
		return null
	}
	return null
}
