const CACHE_NAME = 'saikhant-os-v3'
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json']

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch — Network first, cache fallback ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached || new Response('Offline', { status: 503 })))
  )
})

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Saikhant OS', body: '', url: '/dashboard', icon: '/icons/icon-192.png' }
  try { data = { ...data, ...event.data.json() } } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icons/icon-192.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
      tag: 'saikhant-os',
      renotify: true,
    })
  )
})

// ── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// ── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(flushOfflineQueue())
  }
})

async function flushOfflineQueue() {
  const cache = await caches.open('offline-queue')
  const keys = await cache.keys()
  for (const key of keys) {
    const response = await cache.match(key)
    const data = await response?.json()
    if (data) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: { 'Content-Type': 'application/json', ...data.headers },
          body: JSON.stringify(data.body),
        })
        await cache.delete(key)
      } catch {
        // Will retry next sync
      }
    }
  }
}

// ── Offline action queue (called from app) ───────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'QUEUE_OFFLINE_ACTION') {
    const { url, method, body, headers } = event.data.payload
    caches.open('offline-queue').then((cache) => {
      const key = `${method}-${url}-${Date.now()}`
      cache.put(new Request(key), new Response(JSON.stringify({ url, method, body, headers })))
    })
  }
})
