// Benachrichtigungen: Eintrag dieses Geräts in data.devices lesen und ändern.
import type { Device, NotifySettings } from '@/types/data'
import { nowIso } from '@/lib/dates'
import { currentSubscription, subscribe, unsubscribe } from '@/lib/push'
import { newBase, touch, upsert } from '@/lib/records'
import { loadPref, savePref } from '@/lib/storage'
import { updateData, useAppStore } from '@/store'
import { NOTIFY_DEFAULTS } from './utils'

/** id des eigenen Eintrags in data.devices (pro Gerät lokal gemerkt) */
const PREF = 'pushDeviceId'
const myId = () => loadPref<string | null>(PREF, null)

/** Eigener Geräte-Eintrag; null, wenn nicht angemeldet oder vom Workflow als abgelaufen entfernt */
export function useMyDevice(): Device | null {
  return useAppStore((s) => {
    const id = myId()
    return (id && s.data?.devices.find((d) => d.id === id && !d.deleted)) || null
  })
}

function local() {
  const { device } = useAppStore.getState()
  return { personId: device?.personId ?? '', name: device?.deviceName ?? 'Gerät' }
}

function patchMine(change: (d: Device) => Partial<Device>) {
  const id = myId()
  if (!id) return
  const me = local().personId
  updateData((data) => ({
    ...data,
    devices: data.devices.map((d) => (d.id === id ? touch(d, me, change(d)) : d)),
  }))
}

export const notificationActions = {
  /** Berechtigung anfragen, anmelden und den Eintrag speichern (aus einem Tipp heraus aufrufen) */
  async enable(): Promise<void> {
    const sub = await subscribe()
    const { personId, name } = local()
    const id = myId()
    updateData((data) => {
      const existing = id ? data.devices.find((d) => d.id === id) : undefined
      const record: Device = existing
        ? touch(existing, personId, { deleted: false, personId, name, pushSubscription: sub })
        : { ...newBase(personId), personId, name, pushSubscription: sub, notify: NOTIFY_DEFAULTS, testRequestedAt: null }
      if (!existing) savePref(PREF, record.id)
      return { ...data, devices: upsert(data.devices, record) }
    })
  },

  async disable(): Promise<void> {
    await unsubscribe().catch(() => undefined)
    patchMine(() => ({ deleted: true, pushSubscription: null }))
  },

  update(patch: Partial<NotifySettings>) {
    patchMine((d) => ({ notify: { ...d.notify, ...patch } }))
  },

  /** Der Workflow im Daten-Repo schickt einen Test, sobald der Zeitstempel gespeichert ist */
  requestTest() {
    patchMine(() => ({ testRequestedAt: nowIso() }))
  },

  /**
   * Beim Start: Eintrag aktuell halten (Person, Gerätename, geänderte Anmeldung des Browsers).
   * Fragt nie nach einer Berechtigung.
   */
  async refresh(): Promise<void> {
    const id = myId()
    const record = id ? useAppStore.getState().data?.devices.find((d) => d.id === id && !d.deleted) : null
    if (!record) return
    const { personId, name } = local()
    if (!personId) return
    const sub = await currentSubscription().catch(() => null)
    const changes: Partial<Device> = {}
    if (record.personId !== personId) changes.personId = personId
    if (record.name !== name) changes.name = name
    if (sub && sub.endpoint !== record.pushSubscription?.endpoint) changes.pushSubscription = sub
    if (Object.keys(changes).length > 0) patchMine(() => changes)
  },
}
