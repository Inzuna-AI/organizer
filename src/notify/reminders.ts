// Erinnerungen vor Fälligkeit und tägliche Zusammenfassung (Workflow „reminders“, stündlich).
import type { DataFile, Device } from '@/types/data'
import { addDays } from '@/lib/dates'
import { eventsBetween, involves } from '@/lib/events'
import {
  activeDevices,
  eventUrl,
  isQuiet,
  listTitles,
  overdueSlots,
  relevant,
  slotLabel,
  slotsBetween,
  taskUrl,
  type PushPayload,
  type Slot,
} from './common'
import { berlinParts, berlinWallToDate, minutesOf } from './time'

/** Bereits Verschicktes (notify-state.json im Daten-Repo) */
export interface NotifyState {
  /** Erinnerungs-Schlüssel → Zeitpunkt des Versands */
  sent: Record<string, string>
  /** Gerät → Datum der letzten Zusammenfassung */
  summaries: Record<string, string>
}

export const emptyState = (): NotifyState => ({ sent: {}, summaries: {} })

/** Erinnerungen „am Morgen“ und für ganztägige Aufgaben ab dieser Uhrzeit (bis Mittag) */
export const MORNING = '07:00'
/** Der Workflow läuft stündlich: lieber bis zu 30 Minuten früher als zu spät erinnern */
const EARLY_MS = 30 * 60_000
/** Zusammenfassung höchstens so lange nach der Wunschzeit nachholen (verspätete Läufe) */
const SUMMARY_WINDOW_MIN = 180

const mine = (device: Device) => (s: Slot) =>
  s.status === 'open' && relevant(device, s.task.roomId, s.assigneeIds, { mineOrUnassigned: true })

export function reminderKey(device: Device, s: Slot): string {
  return `r|${device.id}|${s.task.id}|${s.startAt}`
}

/** Fällige Erinnerungen für ein Gerät, gebündelt zu einer Nachricht */
export function dueReminder(
  data: DataFile,
  device: Device,
  now: Date,
  state: NotifyState,
): { payload: PushPayload; keys: string[] } | null {
  const n = device.notify
  if (!n.dueReminder) return null
  const { date: today, time } = berlinParts(now)
  const minutes = minutesOf(time)
  const morning = minutes >= minutesOf(MORNING) && minutes < 12 * 60
  const nowMs = now.getTime()

  const candidates: DueItem[] = [
    ...myEvents(data, device, today, addDays(today, 1)),
    ...slotsBetween(data, today, addDays(today, 1))
      .filter(mine(device))
      .map((s) => ({
        kind: 'task' as const,
        key: reminderKey(device, s),
        title: s.task.title,
        startAt: s.startAt,
        allDay: s.allDay,
        url: taskUrl(s.task.id, s.date),
      })),
  ]
  const due: DueItem[] = []
  for (const s of candidates) {
    if (state.sent[s.key]) continue
    const day = s.startAt.slice(0, 10)
    if (s.allDay || n.dueReminderMinutesBefore < 0) {
      // Ganztägig oder „am Morgen des Tages“: morgens für die Einträge von heute
      const notStarted = s.allDay || berlinWallToDate(s.startAt).getTime() > nowMs
      if (day === today && morning && notStarted) due.push(s)
    } else {
      const start = berlinWallToDate(s.startAt).getTime()
      const remindAt = start - n.dueReminderMinutesBefore * 60_000
      if (nowMs >= remindAt - EARLY_MS && nowMs < start) due.push(s)
    }
  }
  if (due.length === 0) return null

  due.sort((a, b) => a.startAt.localeCompare(b.startAt))
  const keys = due.map((s) => s.key)
  if (due.length === 1) {
    const s = due[0]
    return {
      payload: { title: 'Erinnerung', body: `${s.title} · ${slotLabel(s.startAt, s.allDay, today)}`, url: s.url },
      keys,
    }
  }
  const kinds = new Set(due.map((s) => s.kind))
  const what = kinds.size > 1 ? 'Einträge' : kinds.has('event') ? 'Termine' : 'Aufgaben'
  return {
    payload: { title: `Erinnerung: ${due.length} ${what}`, body: listTitles(due.map((s) => s.title), 4), url: '#/' },
    keys,
  }
}

/** Aufgabe oder Termin, an den erinnert werden kann */
interface DueItem {
  kind: 'task' | 'event'
  key: string
  title: string
  startAt: string
  allDay: boolean
  url: string
}

/** Termine, bei denen die Person des Geräts dabei ist (ohne Personen = alle), die im Zeitraum beginnen */
function myEvents(data: DataFile, device: Device, from: string, to: string): DueItem[] {
  return eventsBetween(data.events ?? [], from, to)
    .filter((i) => i.startAt.slice(0, 10) >= from && involves(i.event, device.personId))
    .map((i) => ({
      kind: 'event' as const,
      key: `r|${device.id}|ev:${i.event.id}|${i.startAt}`,
      title: i.event.title,
      startAt: i.startAt,
      allDay: i.allDay,
      url: eventUrl(i.event.id, i.date),
    }))
}

/**
 * Tägliche Zusammenfassung, sobald die Wunschzeit erreicht ist.
 * payload null = heute nichts zu melden (gilt trotzdem als erledigt).
 */
export function dailySummary(
  data: DataFile,
  device: Device,
  now: Date,
  state: NotifyState,
): { payload: PushPayload | null } | null {
  const n = device.notify
  if (!n.dailySummary) return null
  const { date: today, time } = berlinParts(now)
  if (state.summaries[device.id] === today) return null
  const t = minutesOf(time)
  const at = minutesOf(n.dailySummaryTime)
  if (t < at || t >= at + SUMMARY_WINDOW_MIN) return null

  const todays = slotsBetween(data, today, today).filter(mine(device))
  const overdue = overdueSlots(data, today).filter(mine(device))
  // Auch mehrtägige Termine, die heute noch laufen
  const events = eventsBetween(data.events ?? [], today, today).filter((i) => involves(i.event, device.personId))
  if (todays.length === 0 && overdue.length === 0 && events.length === 0) return { payload: null }

  const counts: string[] = []
  if (events.length > 0) counts.push(events.length === 1 ? '1 Termin' : `${events.length} Termine`)
  if (todays.length > 0 || events.length === 0) counts.push(todays.length === 1 ? '1 Aufgabe' : `${todays.length} Aufgaben`)
  const parts = [`Heute: ${counts.join(', ')}`]
  if (overdue.length > 0) parts.push(`${overdue.length} überfällig`)
  const titles = listTitles([...events.map((i) => i.event.title), ...[...overdue, ...todays].map((s) => s.task.title)], 4)
  return { payload: { title: 'Dein Tag', body: `${parts.join(', ')}\n${titles}`, url: '#/', tag: 'summary' } }
}

/** Alte Einträge entfernen, damit notify-state.json klein bleibt */
export function pruneState(state: NotifyState, now: Date, days = 3): NotifyState {
  const limit = now.getTime() - days * 86_400_000
  const sent = Object.fromEntries(Object.entries(state.sent).filter(([, at]) => Date.parse(at) >= limit))
  return { ...state, sent }
}

/** Ein Lauf: Nachrichten für alle Geräte und der neue Stand von notify-state.json */
export function reminderRun(
  data: DataFile,
  state: NotifyState,
  now: Date,
): { messages: Array<{ device: Device; payload: PushPayload }>; state: NotifyState } {
  const next: NotifyState = { sent: { ...state.sent }, summaries: { ...state.summaries } }
  const messages: Array<{ device: Device; payload: PushPayload }> = []
  const today = berlinParts(now).date
  const at = now.toISOString()

  for (const device of activeDevices(data)) {
    // In Ruhezeiten nichts verschicken und nichts als erledigt markieren
    if (isQuiet(device, now)) continue
    const reminder = dueReminder(data, device, now, next)
    if (reminder) {
      messages.push({ device, payload: reminder.payload })
      for (const k of reminder.keys) next.sent[k] = at
    }
    const summary = dailySummary(data, device, now, next)
    if (summary) {
      if (summary.payload) messages.push({ device, payload: summary.payload })
      next.summaries[device.id] = today
    }
  }
  return { messages, state: pruneState(next, now) }
}
