import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomToken, tokenPattern, tokensMatch } from './tokens.ts'

export interface PairingCode {
	readonly code: string
	readonly expiresAt: number
}

export interface PairingOptions {
	readonly filePath: string
	readonly ttlMs?: number
	readonly refreshMs?: number
	readonly now?: () => number
}

/** Reads the current pairing code written by a running runtime, or null when absent or malformed. */
export function readPairingFile(filePath: string): PairingCode | null {
	try {
		const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			'code' in parsed &&
			'expiresAt' in parsed &&
			typeof parsed.code === 'string' &&
			typeof parsed.expiresAt === 'number' &&
			tokenPattern.test(parsed.code)
		) {
			return { code: parsed.code, expiresAt: parsed.expiresAt }
		}
	} catch {
		return null
	}
	return null
}

/**
 * Holds a single-use pairing code. The code is written to a file that only the current user can read,
 * so a launcher running as that user can open the interface, while websites and other users cannot.
 */
export class PairingService {
	private readonly filePath: string
	private readonly ttlMs: number
	private readonly refreshMs: number
	private readonly now: () => number
	private current: PairingCode | undefined
	private timer: ReturnType<typeof setInterval> | undefined

	constructor(options: PairingOptions) {
		this.filePath = options.filePath
		this.ttlMs = options.ttlMs ?? 10 * 60 * 1000
		this.refreshMs = options.refreshMs ?? 30 * 1000
		this.now = options.now ?? Date.now
	}

	start(): void {
		this.issue()
		this.timer = setInterval(() => {
			if (this.current === undefined || this.current.expiresAt - this.now() < this.refreshMs * 2) this.issue()
		}, this.refreshMs)
		this.timer.unref()
	}

	stop(): void {
		if (this.timer !== undefined) clearInterval(this.timer)
		this.timer = undefined
		this.current = undefined
		rmSync(this.filePath, { force: true })
	}

	/** Returns true once for the current valid code, then replaces it. */
	consume(candidate: string): boolean {
		const current = this.current
		if (current === undefined || !tokenPattern.test(candidate) || this.now() >= current.expiresAt) return false
		if (!tokensMatch(candidate, current.code)) return false
		this.issue()
		return true
	}

	private issue(): void {
		const next: PairingCode = { code: randomToken(16), expiresAt: this.now() + this.ttlMs }
		mkdirSync(dirname(this.filePath), { recursive: true, mode: 0o700 })
		const temporary = `${this.filePath}.tmp`
		writeFileSync(temporary, JSON.stringify(next), { mode: 0o600 })
		renameSync(temporary, this.filePath)
		this.current = next
	}
}
