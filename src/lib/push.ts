// Web Push im Browser: Unterstützung prüfen, Berechtigung anfragen, Subscription anlegen/entfernen.
// Versendet wird von GitHub Actions im Daten-Repo (scripts/notify.mjs).

export type PushSupport = 'ok' | 'dev' | 'no-key' | 'ios-not-installed' | 'unsupported'

export interface SubscriptionData {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function vapidKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '').trim()
}

export function isIos(): boolean {
  const ua = navigator.userAgent
  // iPadOS meldet sich als Mac, hat aber Touch
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** Läuft die App vom Home-Bildschirm (nicht im Browser-Tab)? */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function pushSupport(): PushSupport {
  // Der Service Worker wird nur im Build registriert (main.tsx)
  if (!import.meta.env.PROD) return 'dev'
  if (!vapidKey()) return 'no-key'
  if (isIos() && !isStandalone()) return 'ios-not-installed'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  return 'ok'
}

export function permission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false
  const x = new Uint8Array(a)
  return x.length === b.length && x.every((v, i) => v === b[i])
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Der Service Worker ist nicht bereit. Bitte die App neu laden.')), 10_000),
  )
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

function toData(sub: PushSubscription): SubscriptionData {
  const json = sub.toJSON()
  return { endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' } }
}

/**
 * Berechtigung anfragen und anmelden. Muss direkt aus einem Tipp heraus aufgerufen werden,
 * sonst lehnt iOS die Anfrage ab.
 */
export async function subscribe(): Promise<SubscriptionData> {
  const result = await Notification.requestPermission()
  if (result !== 'granted') {
    throw new Error(
      result === 'denied'
        ? 'Benachrichtigungen sind blockiert. Bitte in den Einstellungen des Browsers bzw. Handys erlauben.'
        : 'Benachrichtigungen wurden nicht erlaubt.',
    )
  }
  const reg = await registration()
  const key = keyBytes(vapidKey())
  let sub = await reg.pushManager.getSubscription()
  // Anmeldung mit einem alten Schlüssel ersetzen
  if (sub && !sameKey(sub.options.applicationServerKey, key)) {
    await sub.unsubscribe()
    sub = null
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  return toData(sub)
}

/** Aktuelle Anmeldung dieses Browsers (ohne nachzufragen) */
export async function currentSubscription(): Promise<SubscriptionData | null> {
  if (pushSupport() !== 'ok' || permission() !== 'granted') return null
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? toData(sub) : null
}

export async function unsubscribe(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  await sub?.unsubscribe()
}

/** Tipp auf eine Benachrichtigung bei offener App: Der Service Worker schickt das Ziel. */
export function listenForNavigation(): void {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
    const msg = e.data as { type?: string; url?: string } | null
    if (msg?.type === 'navigate' && msg.url) window.location.href = msg.url
  })
}
