// Erinnerungen vor Fälligkeit und tägliche Zusammenfassung (Workflow „reminders“, alle 30 Minuten von 6 bis 23 Uhr).
import type { DataFile, Device } from '@/types/data'
import { addDays } from '@/lib/dates'
import { eventsBetween, involves } from '@/lib/events'
import { parseFixedReminder } from '@/lib/reminders'
import { activePeriod, daysLeft, parsePeriodReminder, periodLabel, periodReminderDate, untilLabel } from '@/lib/periods'
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

/** Vor dieser Uhrzeit wird nichts verschickt (auch bei manuellem Start) */
export const ACTIVE_FROM = '06:00'
/** Der Workflow läuft alle 30 Minuten: bis zu 15 Minuten früher erinnern … */
const EARLY_MS = 15 * 60_000
/** … oder bis zu 30 Minuten später, falls GitHub den Lauf verzögert */
const LATE_MS = 30 * 60_000
/** So weit voraus werden Einträge betrachtet (längste Vorlaufzeit: 1 Woche) */
const MAX_DAYS_BEFORE = 7
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
  const today = berlinParts(now).date
  const nowMs = now.getTime()

  // Bis zu einer Woche voraus („1 Woche vorher“)
  const until = addDays(today, MAX_DAYS_BEFORE)
  const candidates: DueItem[] = [
    ...myEvents(data, device, today, until),
    ...slotsBetween(data, today, until)
      .filter(mine(device))
      .map((s) => ({
        kind: 'task' as const,
        key: reminderKey(device, s),
        title: s.task.title,
        startAt: s.startAt,
        allDay: s.allDay,
        url: taskUrl(s.task.id, s.date),
        reminderTimes: s.task.reminderTimes,
      })),
    ...myPeriodTasks(data, device, today),
  ]
  const hit = (w: { from: number; until: number } | null) => !!w && nowMs >= w.from && nowMs < w.until
  const due: DueItem[] = []
  const keys: string[] = []
  for (const s of candidates) {
    // Pro Eintrag höchstens einmal in der Nachricht, auch wenn mehrere Erinnerungen gleichzeitig fällig sind
    const itemKeys: string[] = []
    const checks =
      s.checks ?? (s.reminderTimes ?? []).map((code) => ({ code, window: fixedReminderWindow(s.startAt, code) }))
    for (const { code, window } of checks) {
      const k = `${s.key}|${code}`
      if (!state.sent[k] && hit(window)) itemKeys.push(k)
    }
    if (itemKeys.length > 0) {
      due.push(s)
      keys.push(...itemKeys)
    }
  }
  if (due.length === 0) return null

  due.sort((a, b) => a.startAt.localeCompare(b.startAt))
  if (due.length === 1) {
    const s = due[0]
    return {
      payload: {
        title: 'Erinnerung',
        body: `${s.title} · ${s.label ?? slotLabel(s.startAt, s.allDay, today)}`,
        url: s.url,
      },
      keys,
    }
  }
  const kinds = new Set(due.map((s) => s.kind))
  const what = kinds.size > 1 ? 'Einträge' : kinds.has('event') ? 'Termine' : 'Aufgaben'
  return {
    payload: {
      title: `Erinnerung: ${due.length} ${what}`,
      body: listTitles(
        due.map((s) => s.title),
        4,
      ),
      url: '#/',
    },
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
  /** Feste Uhrzeiten ("-1@15:00" …); ohne = keine Erinnerung */
  reminderTimes?: string[]
  /** Statt reminderTimes: fertig berechnete Zeitfenster (Zeitraum-Aufgaben) */
  checks?: Array<{ code: string; window: { from: number; until: number } | null }>
  /** Statt Datum/Uhrzeit in der Nachricht, z. B. „noch 3 Tage (bis So, 23.11.)“ */
  label?: string
}

/**
 * Zeitraum-Aufgaben mit Erinnerung „zum Start“ / „kurz vor Ablauf“ (9 Uhr), solange der laufende
 * Zeitraum offen ist. Zuständig ist wie in der App die Person des Zeitraums (Rotation).
 */
function myPeriodTasks(data: DataFile, device: Device, today: string): DueItem[] {
  const out: DueItem[] = []
  for (const t of data.tasks) {
    if (t.deleted || !t.period || !t.reminderTimes?.some((c) => parsePeriodReminder(c))) continue
    const p = activePeriod(t, data.occurrences, today)
    if (!p || !relevant(device, t.roomId, p.assigneeIds, { mineOrUnassigned: true })) continue
    const checks: NonNullable<DueItem['checks']> = []
    let label = ''
    for (const code of t.reminderTimes) {
      const r = parsePeriodReminder(code)
      if (!r) continue
      const date = periodReminderDate(p, t.period, r.which)
      if (date !== today) continue
      const at = berlinWallToDate(`${date}T${r.time}`).getTime()
      checks.push({ code, window: { from: at - EARLY_MS, until: at + LATE_MS } })
      const until = untilLabel(p.to, today)
      const text =
        r.which === 'end'
          ? `noch ${daysLeft(date, p.to)} Tage (${until})`
          : `${periodLabel(p, t.period, today)} (${until})`
      if (!label || r.which === 'end') label = text
    }
    if (checks.length === 0) continue
    out.push({
      kind: 'task',
      key: `r|${device.id}|${t.id}|${p.from}`,
      title: t.title,
      startAt: p.from,
      allDay: true,
      url: taskUrl(t.id, t.recurrenceRule ? p.from : null),
      checks,
      label,
    })
  }
  return out
}

/**
 * Feste Uhrzeit: von 15 Minuten vorher bis 30 Minuten danach (Lauf alle 30 Minuten, evtl. verzögert).
 * Gilt auch nach Beginn (z. B. „am Tag 21 Uhr“ für eine noch offene Aufgabe).
 */
export function fixedReminderWindow(startAt: string, code: string): { from: number; until: number } | null {
  const p = parseFixedReminder(code)
  if (!p) return null
  const at = berlinWallToDate(`${addDays(startAt.slice(0, 10), p.days)}T${p.time}`).getTime()
  return { from: at - EARLY_MS, until: at + LATE_MS }
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
      reminderTimes: i.event.reminderTimes,
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
  if (todays.length > 0 || events.length === 0)
    counts.push(todays.length === 1 ? '1 Aufgabe' : `${todays.length} Aufgaben`)
  const parts = [`Heute: ${counts.join(', ')}`]
  if (overdue.length > 0) parts.push(`${overdue.length} überfällig`)
  const titles = listTitles(
    [...events.map((i) => i.event.title), ...[...overdue, ...todays].map((s) => s.task.title)],
    4,
  )
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
  const { date: today, time } = berlinParts(now)
  const at = now.toISOString()
  // Nachts nichts verschicken (auch bei manuellem Start); Fälliges kommt mit dem ersten Lauf ab 6 Uhr
  if (minutesOf(time) < minutesOf(ACTIVE_FROM)) return { messages, state: pruneState(next, now) }

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
