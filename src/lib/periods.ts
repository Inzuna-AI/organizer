// Aufgaben mit Zeitraum statt festem Tag (Feld Task.period, seit v1.4.0):
// „irgendwann diese Woche“, „im Dezember“, „im 1. Quartal“, „im 2. Halbjahr“, „2027“,
// auch wiederkehrend („einmal pro Woche“, „jedes Quartal“).
//
// Gespeichert wird wie bei normalen Aufgaben: startAt ist der erste Tag des Zeitraums (Montag bzw.
// Monatserster, bei Quartal/Halbjahr/Jahr am Kalender ausgerichtet, ganztägig). Eine Serie hat eine
// RRULE: FREQ=WEEKLY;BYDAY=MO bzw. FREQ=MONTHLY mit INTERVAL in Monaten (Quartal = 3, Jahr = 12).
// Ein Zeitraum ist so lang wie der Abstand der Serie („alle 2 Wochen“ = 2 Wochen Zeit).
// Erledigte und ausgelassene Zeiträume stehen wie gewohnt in occurrences.
//
// Wird von der App und von notify gleich verwendet.

import type { Occurrence, Task } from '@/types/data'
import { addDays, formatDay } from './dates'
import { datesBetween, doneInstances, instanceAt, isSeries, parseRule, weekdayIndex, type Instance } from './recurrence'

/** Länge der Zeiträume in Monaten (Woche: siehe unten) */
const UNIT_MONTHS = { month: 1, quarter: 3, half: 6, year: 12 } as const

export type PeriodUnit = 'week' | keyof typeof UNIT_MONTHS

export const PERIOD_UNITS: ReadonlyArray<{ unit: PeriodUnit; label: string }> = [
  { unit: 'week', label: 'Woche' },
  { unit: 'month', label: 'Monat' },
  { unit: 'quarter', label: 'Quartal' },
  { unit: 'half', label: 'Halbjahr' },
  { unit: 'year', label: 'Jahr' },
]

type PeriodTask = Pick<
  Task,
  'id' | 'startAt' | 'allDay' | 'recurrenceRule' | 'recurrenceMode' | 'rotation' | 'assigneeIds' | 'period'
>

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Hat die Aufgabe einen Zeitraum statt eines festen Tages? */
export function isPeriodTask(t: Pick<Task, 'period' | 'startAt'>): boolean {
  return !!t.period && !!t.startAt
}

/** Erster Tag des Zeitraums, in dem das Datum liegt (Montag, Monats-, Quartals-, Halbjahres-, Jahresanfang) */
export function periodStartOf(date: string, unit: PeriodUnit): string {
  if (unit === 'week') return addDays(date.slice(0, 10), -weekdayIndex(date))
  const m = Number(date.slice(5, 7)) - 1
  return `${date.slice(0, 4)}-${pad(m - (m % UNIT_MONTHS[unit]) + 1)}-01`
}

/** Monatserster + n Monate */
function addMonthStarts(start: string, n: number): string {
  const total = Number(start.slice(0, 4)) * 12 + Number(start.slice(5, 7)) - 1 + n
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`
}

/** Nächster Zeitraum gleicher Länge */
export function nextPeriodStart(start: string, unit: PeriodUnit, n = 1): string {
  return unit === 'week' ? addDays(start, 7 * n) : addMonthStarts(start, n * UNIT_MONTHS[unit])
}

/** Abstand der Serie in Zeiträumen (alle n Wochen/Monate/Quartale …), einmalig = 1 */
export function periodInterval(t: Pick<Task, 'recurrenceRule' | 'startAt' | 'period'>): number {
  if (!t.recurrenceRule || !t.startAt) return 1
  const n = parseRule(t.recurrenceRule, t.startAt.slice(0, 10)).interval
  const unit = t.period ?? 'week'
  return unit === 'week' ? n : Math.max(1, Math.round(n / UNIT_MONTHS[unit]))
}

/** Zeitraum, der am Datum start beginnt (inklusive letzter Tag) */
export function periodRange(
  t: Pick<Task, 'period' | 'recurrenceRule' | 'startAt'>,
  start: string,
): { from: string; to: string } {
  const unit = t.period ?? 'week'
  return { from: start, to: addDays(nextPeriodStart(start, unit, periodInterval(t)), -1) }
}

/** RRULE eines wiederkehrenden Zeitraums (gleiche Schreibweise wie buildRule) */
export function periodRule(unit: PeriodUnit, interval: number): string {
  const n = Math.max(1, Math.floor(interval) || 1)
  const parts = [unit === 'week' ? 'FREQ=WEEKLY' : 'FREQ=MONTHLY']
  const every = unit === 'week' ? n : n * UNIT_MONTHS[unit]
  if (every > 1) parts.push(`INTERVAL=${every}`)
  if (unit === 'week') parts.push('BYDAY=MO')
  return parts.join(';')
}

const REPEAT_WORDS: Record<PeriodUnit, [string, string]> = {
  week: ['Jede Woche', 'Wochen'],
  month: ['Jeden Monat', 'Monate'],
  quarter: ['Jedes Quartal', 'Quartale'],
  half: ['Jedes Halbjahr', 'Halbjahre'],
  year: ['Jedes Jahr', 'Jahre'],
}

/** „Jede Woche“, „Alle 2 Monate“, „Jedes Quartal“, „Einmalig“ */
export function describePeriodRepeat(unit: PeriodUnit, interval: number | null): string {
  if (!interval) return 'Einmalig'
  const [one, many] = REPEAT_WORDS[unit]
  return interval === 1 ? one : `Alle ${interval} ${many}`
}

/** „16.11.“ bzw. mit Jahr, wenn es nicht das Jahr von today ist */
function shortDate(date: string, today: string): string {
  const s = `${date.slice(8, 10)}.${date.slice(5, 7)}.`
  return date.slice(0, 4) === today.slice(0, 4) ? s : `${s}${date.slice(0, 4)}`
}

function monthName(date: string, today: string): string {
  const name = MONTHS[Number(date.slice(5, 7)) - 1]
  return date.slice(0, 4) === today.slice(0, 4) ? name : `${name} ${date.slice(0, 4)}`
}

/**
 * Name eines Zeitraums: „Diese Woche“, „Nächste Woche“, „30.11.–06.12.“, „Dezember“, „Dezember–Januar 2027“,
 * „4. Quartal“, „1. Halbjahr 2027“, „2027“.
 */
export function periodLabel(range: { from: string; to: string }, unit: PeriodUnit, today: string): string {
  const { from, to } = range
  if (unit !== 'week') {
    const year = from.slice(0, 4)
    const otherYear = year !== today.slice(0, 4) ? ` ${year}` : ''
    const single = to === addDays(nextPeriodStart(from, unit), -1)
    const index = Math.floor((Number(from.slice(5, 7)) - 1) / UNIT_MONTHS[unit]) + 1
    if (single && unit === 'quarter') return `${index}. Quartal${otherYear}`
    if (single && unit === 'half') return `${index}. Halbjahr${otherYear}`
    if (single && unit === 'year') return year
    const last = `${to.slice(0, 7)}-01`
    if (last === from) return monthName(from, today)
    return `${monthName(from, today)}–${monthName(last, today)}`
  }
  const thisWeek = periodStartOf(today, 'week')
  if (to === addDays(from, 6)) {
    if (from === thisWeek) return 'Diese Woche'
    if (from === addDays(thisWeek, 7)) return 'Nächste Woche'
  }
  return `${shortDate(from, today)}–${shortDate(to, today)}`
}

/** „bis So, 22.11.“ bzw. „bis Heute“ → „bis heute“ */
export function untilLabel(to: string, today: string): string {
  const d = formatDay(to, today)
  return `bis ${d === 'Heute' || d === 'Morgen' ? d.toLowerCase() : d}`
}

/**
 * Zeiträume einer Serie für Listen: der laufende Zeitraum (offen oder erledigt). Ist er erledigt oder
 * ausgelassen, oder hat die Serie noch nicht begonnen, zusätzlich der nächste offene. Dazu alle erledigten.
 * Verpasste frühere Zeiträume verfallen still.
 */
export function periodInstances(t: PeriodTask, occurrences: Occurrence[], today: string): Instance[] {
  if (!isPeriodTask(t) || !isSeries(t)) return []
  const out = new Map<string, Instance>()
  const current = currentPeriod(t, occurrences, today)
  if (current) out.set(current.date, current)
  if (!current || current.status === 'done') {
    const next = upcomingPeriod(t, occurrences, today)
    if (next) out.set(next.date, next)
  }
  for (const d of doneInstances(t, occurrences)) out.set(d.date, d)
  return [...out.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Laufender Zeitraum (enthält today); null, wenn keiner läuft oder er ausgelassen wurde */
export function currentPeriod(t: PeriodTask, occurrences: Occurrence[], today: string): Instance | null {
  if (!isPeriodTask(t) || !isSeries(t)) return null
  const n = periodInterval(t)
  const unit = t.period ?? 'week'
  const reach = unit === 'week' ? 7 * n : 31 * UNIT_MONTHS[unit] * n
  const start = datesBetween(t, addDays(today, -reach), today).at(-1)
  if (!start || periodRange(t, start).to < today) return null
  return instanceAt(t, occurrences, start)
}

/** Nächster offener Zeitraum, der nach today beginnt */
function upcomingPeriod(t: PeriodTask, occurrences: Occurrence[], today: string): Instance | null {
  for (const date of datesBetween(t, addDays(today, 1), addDays(today, 10 * 366), 10)) {
    const inst = instanceAt(t, occurrences, date)
    if (inst && inst.status === 'open') return inst
  }
  return null
}

/** Offener Zeitraum, um den es gerade geht (laufend, sonst der nächste); für „zuständig“-Nachrichten */
export function openPeriod(t: PeriodTask, occurrences: Occurrence[], today: string): Instance | null {
  const current = currentPeriod(t, occurrences, today)
  if (current && current.status === 'open') return current
  return upcomingPeriod(t, occurrences, today)
}

// ---------- Erinnerungen ----------

/**
 * Feste Erinnerungen für Zeitraum-Aufgaben (im Feld reminderTimes, neben den Codes fester Tage):
 * zum Start des Zeitraums und kurz vor Ablauf (nur, solange noch offen). Immer 9 Uhr.
 * Ältere notify-Versionen kennen die Codes nicht und überspringen sie.
 */
export const PERIOD_REMINDERS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'start@09:00', label: 'Zum Start, 9 Uhr' },
  { code: 'end@09:00', label: 'Kurz vor Ablauf, 9 Uhr' },
]

export const DEFAULT_PERIOD_REMINDERS = PERIOD_REMINDERS.map((r) => r.code)

/** "end@09:00" → { which: 'end', time: '09:00' }; null bei anderem Wert */
export function parsePeriodReminder(code: string): { which: 'start' | 'end'; time: string } | null {
  const m = /^(start|end)@([01]\d|2[0-3]):([0-5]\d)$/.exec(code)
  return m ? { which: m[1] as 'start' | 'end', time: `${m[2]}:${m[3]}` } : null
}

/** Nur gültige Zeitraum-Codes in fester Reihenfolge; leer = undefined (Feld entfällt) */
export function normalizePeriodReminders(codes: string[] | undefined): string[] | undefined {
  const valid = DEFAULT_PERIOD_REMINDERS.filter((c) => codes?.includes(c))
  return valid.length > 0 ? valid : undefined
}

/**
 * Tag der Erinnerung in einem Zeitraum:
 * Start = erster Tag (beim Jahr der 2. Januar). Vor Ablauf: Woche = Freitag (noch 3 Tage),
 * Monat = noch 7 Tage, Quartal = noch 14 Tage, Halbjahr/Jahr = Anfang des letzten Monats.
 */
export function periodReminderDate(
  range: { from: string; to: string },
  unit: PeriodUnit,
  which: 'start' | 'end',
): string {
  if (which === 'start') return unit === 'year' && range.from.endsWith('-01-01') ? addDays(range.from, 1) : range.from
  switch (unit) {
    case 'week':
      return addDays(range.to, -2)
    case 'month':
      return addDays(range.to, -6)
    case 'quarter':
      return addDays(range.to, -13)
    default:
      return `${range.to.slice(0, 7)}-01`
  }
}

/** Anzahl Tage von date bis einschließlich to */
export function daysLeft(date: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000) + 1
}

/** Zeitraum einer Aufgabe, um den es heute geht: laufend und offen (Serie) bzw. der einmalige Zeitraum */
export function activePeriod(
  t: PeriodTask & Pick<Task, 'status'>,
  occurrences: Occurrence[],
  today: string,
): { from: string; to: string; assigneeIds: string[] } | null {
  if (!isPeriodTask(t)) return null
  if (isSeries(t)) {
    const cur = currentPeriod(t, occurrences, today)
    if (!cur || cur.status !== 'open') return null
    return { ...periodRange(t, cur.date), assigneeIds: cur.assigneeIds }
  }
  if (t.status === 'done') return null
  const range = periodRange(t, t.startAt!.slice(0, 10))
  return range.from <= today && today <= range.to ? { ...range, assigneeIds: t.assigneeIds } : null
}
