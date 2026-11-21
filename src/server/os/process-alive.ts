/** Whether a process with this id is running. */
export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch (error) {
		return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EPERM'
	}
}
