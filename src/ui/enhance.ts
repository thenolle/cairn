/** Makes the top bar solid once the page has scrolled. Without script it stays a gradient. */
export function initTopbar(): void {
	const bar = document.querySelector<HTMLElement>('[data-topbar]')
	if (bar === null) return
	const update = (): void => {
		bar.classList.toggle('is-solid', window.scrollY > 8)
	}
	update()
	window.addEventListener('scroll', update, { passive: true })
}

/** Wires each row's previous and next buttons. The buttons only appear when the row overflows. */
export function initRows(): void {
	for (const row of document.querySelectorAll<HTMLElement>('[data-row]')) {
		const list = row.querySelector<HTMLElement>('[data-row-list]')
		const previous = row.querySelector<HTMLButtonElement>('[data-row-previous]')
		const next = row.querySelector<HTMLButtonElement>('[data-row-next]')
		if (list === null || previous === null || next === null) continue

		const sync = (): void => {
			const limit = list.scrollWidth - list.clientWidth
			row.classList.toggle('is-scrollable', limit > 4)
			previous.disabled = list.scrollLeft <= 4
			next.disabled = list.scrollLeft >= limit - 4
		}
		const step = (direction: 1 | -1): void => {
			const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
			list.scrollBy({ left: direction * list.clientWidth * 0.85, behavior: reduced ? 'auto' : 'smooth' })
		}

		previous.addEventListener('click', () => step(-1))
		next.addEventListener('click', () => step(1))
		list.addEventListener('scroll', sync, { passive: true })
		window.addEventListener('resize', sync)
		sync()
	}
}
