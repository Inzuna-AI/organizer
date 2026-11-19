// Gemeinsame Bausteine für Benachrichtigungen (laufen im GitHub-Workflow, nicht in der App).
import type { DataFile, Device, Occurrence, Task } from '@/types/data'
import { expandRange, isSeries, nextOpen, overdueInstance } from '@/lib/recurrence'
import { formatDay } from '@/lib/dates'
import { berlinParts, inQuietHours } from './time'

/** Inhalt einer Push-Nachricht; der Service Worker zeigt sie an. */
export interface PushPayload {
  title: string
  body: string
  /** relativ zur App, z. B. „#/aufgaben/<id>?datum=…“ */
  url: string
  tag?: string
}

/** Ein konkreter Termin einer Aufgabe (bei Serien eine Instanz) */
export interface Slot {
  task: Task
  /** ursprüngliches Datum bei Serien, sonst null */
  date: string | null
  startAt: string
  allDay: boolean
  status: 'open' | 'done'
  assigneeIds: string[]
}

/** Ruhezeiten dieses Geräts (Berliner Uhrzeit) */
export function isQuiet(device: Device, now: Date): boolean {
  return inQuietHours(berlinParts(now).time, device.notify.quietHours)
}

/** Abgelaufene Push-Anmeldungen (HTTP 404/410) als gelöscht markieren */
export function expireDevices(data: DataFile, ids: string[], nowIso: string): DataFile {
  if (ids.length === 0) return data
  const set = new Set(ids)
  return {
    ...data,
    devices: data.devices.map((d) =>
      set.has(d.id) ? { ...d, deleted: true, pushSubscription: null, updatedAt: nowIso, updatedBy: null } : d,
    ),
  }
}

/** Geräte, an die gesendet werden kann */
export function activeDevices(data: DataFile): Device[] {
  return data.devices.filter((d) => !d.deleted && d.pushSubscription?.endpoint)
}

export function personName(data: DataFile, id: string | null): string {
  return data.persons.find((p) => p.id === id)?.name ?? 'Jemand'
}

export function taskUrl(taskId: string, date: string | null): string {
  return date ? `#/aufgaben/${taskId}?datum=${date}` : `#/aufgaben/${taskId}`
}

/** Termine aller Aufgaben im Zeitraum [from, to] (nach tatsächlichem Datum) */
export function slotsBetween(data: DataFile, from: string, to: string): Slot[] {
  const out: Slot[] = []
  for (const t of data.tasks) {
    if (t.deleted || !t.startAt) continue
    if (isSeries(t)) {
      for (const i of expandRange(t, data.occurrences, from, to)) {
        out.push({ task: t, date: i.date, startAt: i.startAt, allDay: i.allDay, status: i.status, assigneeIds: i.assigneeIds })
      }
    } else {
      const day = t.startAt.slice(0, 10)
      if (day >= from && day <= to) {
        out.push({
          task: t,
          date: null,
          startAt: t.startAt,
          allDay: t.allDay || t.startAt.length < 16,
          status: t.status,
          assigneeIds: t.assigneeIds,
        })
      }
    }
  }
  return out
}

/** Überfällige offene Termine (bei Serien nur der letzte verpasste, wie in der App) */
export function overdueSlots(data: DataFile, today: string): Slot[] {
  const out: Slot[] = []
  for (const t of data.tasks) {
    if (t.deleted || !t.startAt) continue
    if (isSeries(t)) {
      const i = overdueInstance(t, data.occurrences, today)
      if (i) out.push({ task: t, date: i.date, startAt: i.startAt, allDay: i.allDay, status: 'open', assigneeIds: i.assigneeIds })
    } else if (t.status === 'open' && t.startAt.slice(0, 10) < today) {
      out.push({ task: t, date: null, startAt: t.startAt, allDay: t.allDay, status: 'open', assigneeIds: t.assigneeIds })
    }
  }
  return out
}

/** Wer ist aktuell zuständig? Bei Serien die Personen des nächsten offenen Termins. */
export function currentAssignees(t: Task, occurrences: Occurrence[], today: string): { ids: string[]; date: string | null } {
  if (!isSeries(t)) return { ids: t.assigneeIds, date: null }
  const i = nextOpen(t, occurrences, today)
  return i ? { ids: i.assigneeIds, date: i.date } : { ids: [], date: null }
}

/**
 * Betrifft eine Aufgabe dieses Gerät? Raumfilter gilt immer, „Nur meine Aufgaben“ nur, wenn gesetzt.
 * mineOrUnassigned: auch Aufgaben ohne Zuständige zählen (für Erinnerungen und Zusammenfassung).
 */
export function relevant(
  device: Device,
  roomId: string | null,
  assigneeIds: string[],
  opts: { mineOrUnassigned?: boolean } = {},
): boolean {
  const n = device.notify
  if (n.rooms.length > 0 && (!roomId || !n.rooms.includes(roomId))) return false
  const mine = assigneeIds.includes(device.personId)
  if (opts.mineOrUnassigned) return mine || (!n.onlyMyTasks && assigneeIds.length === 0)
  return !n.onlyMyTasks || mine
}

/** „Heute 10:00“, „Morgen“ oder „Sa, 21.11.“ für die Nachricht */
export function slotLabel(startAt: string, allDay: boolean, today: string): string {
  const day = formatDay(startAt.slice(0, 10), today)
  return !allDay && startAt.length >= 16 ? `${day} ${startAt.slice(11, 16)}` : day
}

/** Titel aufzählen: „A, B, C und 2 weitere“ */
export function listTitles(titles: string[], max = 3): string {
  const uniq = [...new Set(titles)]
  if (uniq.length <= max) return uniq.join(', ')
  return `${uniq.slice(0, max).join(', ')} und ${uniq.length - max} weitere`
}
