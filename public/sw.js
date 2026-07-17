// ponytail: app-shell cache only — /api stays online-only, no offline mutation queue
const CACHE = 'life-app-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add('/')).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return

  // Hashed build assets are immutable — cache-first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(e.request)
        if (hit) return hit
        const res = await fetch(e.request)
        if (res.ok) c.put(e.request, res.clone())
        return res
      }),
    )
    return
  }

  // Everything else (navigations, icons): network-first, cache fallback for offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && e.request.mode === 'navigate') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
        }
        return res
      })
      .catch(() => caches.match(e.request.mode === 'navigate' ? '/' : e.request)),
  )
})
