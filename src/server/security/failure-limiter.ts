interface Entry {
	readonly count: number
	readonly windowStart: number
}

export interface FailureLimiterOptions {
	readonly maxFailures: number
	readonly windowMs: number
	readonly now?: () => number
}

/** Blocks a key after too many failures inside a time window. */
export class FailureLimiter {
	private readonly entries = new Map<string, Entry>()
	private readonly maxFailures: number
	private readonly windowMs: number
	private readonly now: () => number

	constructor(options: FailureLimiterOptions) {
		this.maxFailures = options.maxFailures
		this.windowMs = options.windowMs
		this.now = options.now ?? Date.now
	}

	/** Seconds until the key may try again, or 0 when it is not blocked. */
	retryAfterSeconds(key: string): number {
		const entry = this.entries.get(key)
		if (entry === undefined) return 0
		const elapsed = this.now() - entry.windowStart
		if (elapsed >= this.windowMs) {
			this.entries.delete(key)
			return 0
		}
		return entry.count >= this.maxFailures ? Math.ceil((this.windowMs - elapsed) / 1000) : 0
	}

	recordFailure(key: string): void {
		const now = this.now()
		const entry = this.entries.get(key)
		if (entry === undefined || now - entry.windowStart >= this.windowMs) {
			this.entries.set(key, { count: 1, windowStart: now })
			return
		}
		this.entries.set(key, { count: entry.count + 1, windowStart: entry.windowStart })
	}

	reset(key: string): void {
		this.entries.delete(key)
	}
}
