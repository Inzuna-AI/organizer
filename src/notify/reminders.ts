// Erinnerungen vor Fälligkeit und tägliche Zusammenfassung (Workflow „reminders“, stündlich).
import type { DataFile, Device } from '@/types/data'
import { addDays } from '@/lib/dates'
import {
  activeDevices,
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

  const due: Slot[] = []
  for (const s of slotsBetween(data, today, addDays(today, 1)).filter(mine(device))) {
    if (state.sent[reminderKey(device, s)]) continue
    const day = s.startAt.slice(0, 10)
    if (s.allDay || n.dueReminderMinutesBefore < 0) {
      // Ganztägig oder „am Morgen des Tages“: morgens für die Aufgaben von heute
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
  const keys = due.map((s) => reminderKey(device, s))
  if (due.length === 1) {
    const s = due[0]
    return {
      payload: {
        title: 'Erinnerung',
        body: `${s.task.title} · ${slotLabel(s.startAt, s.allDay, today)}`,
        url: taskUrl(s.task.id, s.date),
      },
      keys,
    }
  }
  return {
    payload: { title: `Erinnerung: ${due.length} Aufgaben`, body: listTitles(due.map((s) => s.task.title), 4), url: '#/' },
    keys,
  }
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
  if (todays.length === 0 && overdue.length === 0) return { payload: null }

  const parts = [`Heute: ${todays.length === 1 ? '1 Aufgabe' : `${todays.length} Aufgaben`}`]
  if (overdue.length > 0) parts.push(`${overdue.length} überfällig`)
  const titles = listTitles([...overdue, ...todays].map((s) => s.task.title), 4)
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
