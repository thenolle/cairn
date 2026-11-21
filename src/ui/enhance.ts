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

/** Closes the account menu when you click elsewhere or press Escape. */
export function initMenus(): void {
	const close = (inside: Node | null): void => {
		for (const menu of document.querySelectorAll<HTMLDetailsElement>('details.account[open]')) {
			if (inside === null || !menu.contains(inside)) menu.removeAttribute('open')
		}
	}
	document.addEventListener('click', (event) => close(event.target instanceof Node ? event.target : null))
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') close(null)
	})
}

/** Wires each row's arrows and page indicator. Both only appear when the row overflows. */
export function initRows(): void {
	for (const row of document.querySelectorAll<HTMLElement>('[data-row]')) {
		const list = row.querySelector<HTMLElement>('[data-row-list]')
		const previous = row.querySelector<HTMLButtonElement>('[data-row-previous]')
		const next = row.querySelector<HTMLButtonElement>('[data-row-next]')
		if (list === null || previous === null || next === null) continue
		const pager = document.createElement('ul')
		pager.className = 'row-pager'
		pager.setAttribute('aria-hidden', 'true')
		row.querySelector('.row-heading')?.append(pager)
		const sync = (): void => {
			const limit = list.scrollWidth - list.clientWidth
			row.classList.toggle('is-scrollable', limit > 4)
			previous.disabled = list.scrollLeft <= 4
			next.disabled = list.scrollLeft >= limit - 4
			const width = Math.max(1, list.clientWidth)
			const pages = Math.max(1, Math.ceil(list.scrollWidth / width))
			if (pager.children.length !== pages) pager.replaceChildren(...Array.from({ length: pages }, () => document.createElement('li')))
			const current = Math.min(pages - 1, Math.round(list.scrollLeft / width))
			Array.from(pager.children).forEach((item, index) => item.classList.toggle('is-active', index === current))
			pager.hidden = pages < 2
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
