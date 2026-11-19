/// <reference lib="webworker" />
// Service Worker: Offline-Cache der App-Dateien.
// push und notificationclick folgen in Phase 6.
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
