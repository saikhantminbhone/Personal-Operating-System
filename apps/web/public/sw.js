const CACHE_NAME = 'saikhant-os-v2'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API calls
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached || fetch(request)))
  )
})

// Background sync for offline task completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncOfflineTasks())
  }
})

async function syncOfflineTasks() {
  const cache = await caches.open('offline-tasks')
  const keys = await cache.keys()
  for (const key of keys) {
    const response = await cache.match(key)
    const data = await response?.json()
    if (data) {
      try {
        await fetch(data.url, { method: data.method, headers: data.headers, body: JSON.stringify(data.body) })
        await cache.delete(key)
      } catch {}
    }
  }
}
