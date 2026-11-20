import { hashToken, randomToken, tokenPattern } from './tokens.ts'

export interface SessionRecord {
	readonly createdAt: number
	readonly lastSeenAt: number
}

export interface SessionStore {
	get(id: string): SessionRecord | undefined
	set(id: string, record: SessionRecord): void
	delete(id: string): void
}

export class MemorySessionStore implements SessionStore {
	private readonly records = new Map<string, SessionRecord>()

	get(id: string): SessionRecord | undefined {
		return this.records.get(id)
	}

	set(id: string, record: SessionRecord): void {
		this.records.set(id, record)
	}

	delete(id: string): void {
		this.records.delete(id)
	}
}

export interface SessionOptions {
	readonly idleMs?: number
	readonly absoluteMs?: number
	readonly now?: () => number
}

export interface CreatedSession {
	readonly token: string
	readonly maxAgeSeconds: number
}

const day = 24 * 60 * 60 * 1000

/** Issues and validates browser sessions. Only token hashes reach the store. */
export class SessionService {
	private readonly store: SessionStore
	private readonly idleMs: number
	private readonly absoluteMs: number
	private readonly now: () => number

	constructor(store: SessionStore, options: SessionOptions = {}) {
		this.store = store
		this.idleMs = options.idleMs ?? 30 * day
		this.absoluteMs = options.absoluteMs ?? 90 * day
		this.now = options.now ?? Date.now
	}

	create(): CreatedSession {
		const token = randomToken()
		const now = this.now()
		this.store.set(hashToken(token), { createdAt: now, lastSeenAt: now })
		return { token, maxAgeSeconds: Math.floor(this.absoluteMs / 1000) }
	}

	validate(token: string): boolean {
		if (!tokenPattern.test(token)) return false
		const id = hashToken(token)
		const record = this.store.get(id)
		if (record === undefined) return false
		const now = this.now()
		if (now - record.createdAt >= this.absoluteMs || now - record.lastSeenAt >= this.idleMs) {
			this.store.delete(id)
			return false
		}
		this.store.set(id, { createdAt: record.createdAt, lastSeenAt: now })
		return true
	}

	revoke(token: string): void {
		this.store.delete(hashToken(token))
	}
}
