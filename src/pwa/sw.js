import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { clientsClaim } from 'workbox-core'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
clientsClaim()

const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(
    async (params) => {
      try {
        return await navigationHandler(params)
      } catch {
        const offline = await caches.match('/offline.html')
        return offline || Response.error()
      }
    },
    { denylist: [/^\/api\//] },
  ),
)

registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({ cacheName: 'fonts', plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })] }),
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const taskId = event.notification.data && event.notification.data.taskId
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const existing = clientList.find((c) => 'focus' in c)
      if (existing) {
        await existing.focus()
        if (taskId) existing.postMessage({ type: 'open-task', taskId })
        return
      }
      const url = taskId ? `/today?task=${encodeURIComponent(taskId)}` : '/today'
      await self.clients.openWindow(url)
    }),
  )
})
