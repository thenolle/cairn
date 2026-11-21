const pollMs = 5000

function activeIds(value: unknown): Set<string> | null {
	if (typeof value !== 'object' || value === null || !('active' in value) || !Array.isArray(value.active)) return null
	const ids = new Set<string>()
	for (const entry of value.active as unknown[]) {
		if (typeof entry === 'object' && entry !== null && 'gameId' in entry && typeof entry.gameId === 'string') ids.add(entry.gameId)
	}
	return ids
}

/** Marks running games on the page, and reloads a game's page when its session ends so playtime is current. */
export function initActivity(): void {
	let previous: Set<string> | null = null
	const poll = async (): Promise<void> => {
		if (document.visibilityState !== 'visible') return
		try {
			const response = await fetch('/api/activity', { headers: { accept: 'application/json' }, cache: 'no-store' })
			if (!response.ok) return
			const ids = activeIds(await response.json())
			if (ids === null) return
			for (const element of document.querySelectorAll<HTMLElement>('[data-live-game]')) element.toggleAttribute('data-live', ids.has(element.dataset['liveGame'] ?? ''))
			const pageId = document.querySelector<HTMLElement>('[data-game-page]')?.dataset['gamePage']
			if (pageId !== undefined && previous?.has(pageId) === true && !ids.has(pageId)) location.reload()
			previous = ids
		} catch {
			// The runtime may be restarting. The next poll tries again.
		}
	}
	void poll()
	setInterval(() => void poll(), pollMs)
	document.addEventListener('visibilitychange', () => void poll())
}
