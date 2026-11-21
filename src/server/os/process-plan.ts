import { isAbsolute } from 'node:path'
import type { ProcessPlan } from '../integrations/adapter.ts'

const scriptLike = /\.(bat|cmd|com|ps1|vbs|vbe|js|jse|wsf|wsh|msc|lnk|scr|pif|hta)$/iu
const maxArguments = 32
const maxArgumentLength = 2048

/** Programs that may be started. On Windows only .exe files qualify, because batch files re-interpret their arguments. */
export function isAllowedExecutable(path: string, platform: string): boolean {
	if (path.length > 1024 || path.includes('\0') || !isAbsolute(path) || scriptLike.test(path)) return false
	return platform !== 'win32' || /\.exe$/iu.test(path)
}

/** The last check before a process is started. Arguments are passed as an array and never through a shell. */
export function isSafeProcessPlan(plan: ProcessPlan, platform: string): boolean {
	return (
		isAllowedExecutable(plan.executable, platform) &&
		isAbsolute(plan.cwd) &&
		plan.args.length <= maxArguments &&
		plan.args.every((argument) => argument.length <= maxArgumentLength && !argument.includes('\0'))
	)
}
