import type { ProcessPlan } from '../integrations/adapter.ts'

export type StartedProcess = { readonly pid: number | null }

/** Starts a process. Resolves to null when it could not start or exited with an error straight away. */
export type ProcessStarter = (plan: ProcessPlan) => Promise<StartedProcess | null>

const settleMs = 2000

export const startProcess: ProcessStarter = async (plan) => {
	try {
		const child = Bun.spawn([plan.executable, ...plan.args], { cwd: plan.cwd, stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' })
		child.unref()
		let timer: ReturnType<typeof setTimeout> | undefined
		const early = await Promise.race([
			child.exited,
			new Promise<'running'>((resolve) => {
				timer = setTimeout(() => resolve('running'), settleMs)
			})
		])
		clearTimeout(timer)
		if (early === 'running') return { pid: child.pid }
		return early === 0 ? { pid: null } : null
	} catch {
		return null
	}
}
