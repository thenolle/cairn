const cacheName = 'cairn-shell-__CACHE_ID__'
const shellPrefix = 'cairn-shell-'
const precache = __PRECACHE__

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(precache)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(shellPrefix) && key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

async function offlinePage() {
	const cached = await caches.match('/offline')
	return cached ?? Response.error()
}

async function cacheFirst(request) {
	const cached = await caches.match(request)
	if (cached !== undefined) return cached
	const response = await fetch(request)
	if (response.ok) {
		const cache = await caches.open(cacheName)
		await cache.put(request, response.clone())
	}
	return response
}

self.addEventListener('fetch', (event) => {
	const { request } = event
	if (request.method !== 'GET') return
	const url = new URL(request.url)
	if (url.origin !== self.location.origin) return
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(offlinePage))
		return
	}
	if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request))
})
