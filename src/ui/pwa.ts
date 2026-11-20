/** Registers the service worker that keeps the application shell available offline. */
export function registerServiceWorker(): void {
	if (!('serviceWorker' in navigator)) return
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
			console.warn('[cairn] the offline shell could not be enabled', error)
		})
	})
}
