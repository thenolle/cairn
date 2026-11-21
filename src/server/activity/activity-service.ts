import { realpath } from 'node:fs/promises'
import type { ActivitySnapshot, PlaySession } from '../../shared/activity.ts'
import type { SqliteActivityRepository } from '../database/repositories/activity-repository.ts'
import type { Logger } from '../logging/logger.ts'
import { matchKey, rootKey } from '../os/path-match.ts'
import type { ProcessLister } from '../os/process-list.ts'
import { isGameId } from '../library/library-service.ts'
import { isProcessAlive } from '../os/process-alive.ts'

export interface ActivityServiceOptions {
	readonly repository: SqliteActivityRepository
	readonly listProcesses: ProcessLister
	readonly logger: Logger
	readonly caseInsensitive: boolean
	readonly intervalMs?: number
	readonly now?: () => number
	readonly newId?: () => string
}

interface Tracked {
	readonly sessionId: string
	readonly startedAt: number
	lastSeenAt: number
	misses: number
}

const graceChecks = 2
const minSessionSeconds = 15

/**
 * Notices which games are running by looking for processes that run from a game's install folder,
 * and records play sessions. It never inspects or stores process arguments.
 */
export class ActivityService {
	private readonly repository: SqliteActivityRepository
	private readonly listProcesses: ProcessLister
	private readonly logger: Logger
	private readonly caseInsensitive: boolean
	private readonly intervalMs: number
	private readonly now: () => number
	private readonly newId: () => string
	private readonly tracked = new Map<string, Tracked>()
	private readonly resolved = new Map<string, string>()
	private readonly pids = new Map<string, number>()
	private timer: ReturnType<typeof setInterval> | undefined
	private checking = false

	constructor(options: ActivityServiceOptions) {
		this.repository = options.repository
		this.listProcesses = options.listProcesses
		this.logger = options.logger
		this.caseInsensitive = options.caseInsensitive
		this.intervalMs = options.intervalMs ?? 10_000
		this.now = options.now ?? Date.now
		this.newId = options.newId ?? (() => crypto.randomUUID())
	}

	/** Follows a process Cairn started, such as an emulator, so the game counts as running until it exits. */
	attach(gameId: string, pid: number): void {
		this.pids.set(gameId, pid)
		this.seen(gameId, this.now())
	}

	/** Resumes sessions left open by an earlier run, then starts checking. */
	start(): void {
		for (const open of this.repository.openSessions()) {
			if (this.tracked.has(open.gameId)) {
				this.repository.finish(open.id, open.lastSeenAt, minSessionSeconds)
				continue
			}
			this.tracked.set(open.gameId, { sessionId: open.id, startedAt: open.startedAt, lastSeenAt: open.lastSeenAt, misses: 0 })
		}
		this.timer = setInterval(() => void this.check(), this.intervalMs)
		void this.check()
	}

	/** Stops checking. Open sessions stay open so a restart can resume them. */
	stop(): void {
		if (this.timer !== undefined) clearInterval(this.timer)
		this.timer = undefined
	}

	snapshot(): ActivitySnapshot {
		return { active: [...this.tracked].map(([gameId, entry]) => ({ gameId, startedAt: entry.startedAt })), at: this.now() }
	}

	activeSince(gameId: string): number | null {
		return this.tracked.get(gameId)?.startedAt ?? null
	}

	recentSessions(gameId: string, limit: number): readonly PlaySession[] {
		return isGameId(gameId) ? this.repository.recent(gameId, limit) : []
	}

	private async roots(path: string): Promise<readonly string[]> {
		let real = this.resolved.get(path)
		if (real === undefined) {
			real = await realpath(path).catch(() => path)
			this.resolved.set(path, real)
		}
		return [...new Set([rootKey(path, this.caseInsensitive), rootKey(real, this.caseInsensitive)])]
	}

	async check(): Promise<void> {
		if (this.checking) return
		this.checking = true
		try {
			const locations = this.repository.locations()
			if (locations.length === 0 && this.tracked.size === 0) return
			const active = new Set<string>()
			for (const [gameId, pid] of this.pids) {
				if (isProcessAlive(pid)) active.add(gameId)
				else this.pids.delete(gameId)
			}
			if (locations.length > 0) {
				const candidates = (await this.listProcesses()).map((entry) => matchKey(entry, this.caseInsensitive))
				for (const location of locations) {
					const roots = await this.roots(location.path)
					if (candidates.some((candidate) => roots.some((root) => candidate.startsWith(root)))) active.add(location.gameId)
				}
			}
			const at = this.now()
			for (const gameId of active) this.seen(gameId, at)
			for (const [gameId, entry] of this.tracked) {
				if (active.has(gameId)) continue
				entry.misses += 1
				if (entry.misses >= graceChecks) this.end(gameId, entry)
			}
		} catch (error) {
			this.logger.warn('Activity check failed', { error })
		} finally {
			this.checking = false
		}
	}

	private seen(gameId: string, at: number): void {
		const existing = this.tracked.get(gameId)
		if (existing !== undefined) {
			existing.lastSeenAt = at
			existing.misses = 0
			this.repository.touch(existing.sessionId, at)
			return
		}
		const sessionId = this.newId()
		this.repository.start(sessionId, gameId, at)
		this.tracked.set(gameId, { sessionId, startedAt: at, lastSeenAt: at, misses: 0 })
		this.logger.info('Play session started', { id: gameId })
	}

	private end(gameId: string, entry: Tracked): void {
		const seconds = this.repository.finish(entry.sessionId, entry.lastSeenAt, minSessionSeconds)
		this.tracked.delete(gameId)
		this.logger.info('Play session ended', { id: gameId, seconds })
	}
}
