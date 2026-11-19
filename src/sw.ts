/// <reference lib="webworker" />
// Service Worker: Offline-Cache der App-Dateien und Push-Benachrichtigungen.
// Anfragen an api.github.com werden bewusst nicht zwischengespeichert.

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import type { PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// HashRouter: Jede Navigation landet auf index.html
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// ---------- Push ----------

/** Inhalt, den scripts/notify.mjs im Daten-Repo schickt */
interface PushPayload {
  title: string
  body: string
  /** relativ zur App, z. B. „#/aufgaben/<id>“ */
  url?: string
  tag?: string
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = { title: 'Organizer', body: '' }
  try {
    payload = { ...payload, ...(event.data?.json() as PushPayload) }
  } catch {
    payload.body = event.data?.text() ?? ''
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: payload.url ?? '' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data as { url?: string } | null)?.url ?? '', self.registration.scope).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Offenes App-Fenster nutzen, sonst ein neues öffnen
      const client = windows.find((c) => c.url.startsWith(self.registration.scope))
      if (client) {
        // Die App wechselt selbst zur Seite (HashRouter, siehe lib/push.ts listenForNavigation)
        client.postMessage({ type: 'navigate', url: target })
        await client.focus()
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
