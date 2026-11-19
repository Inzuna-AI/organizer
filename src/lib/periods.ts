// Aufgaben mit Zeitraum statt festem Tag (Feld Task.period, seit v1.4.0):
// „irgendwann diese Woche“ bzw. „irgendwann im Dezember“, auch wiederkehrend („einmal pro Woche“).
//
// Gespeichert wird wie bei normalen Aufgaben: startAt ist der erste Tag des Zeitraums (Montag bzw.
// Monatserster, ganztägig), eine Serie hat eine RRULE (FREQ=WEEKLY;BYDAY=MO bzw. FREQ=MONTHLY).
// Ein Zeitraum ist so lang wie der Abstand der Serie („alle 2 Wochen“ = 2 Wochen Zeit).
// Erledigte und ausgelassene Zeiträume stehen wie gewohnt in occurrences.
//
// Wird von der App und von notify gleich verwendet.

import type { Occurrence, Task } from '@/types/data'
import { addDays, formatDay } from './dates'
import { datesBetween, doneInstances, instanceAt, isSeries, parseRule, weekdayIndex, type Instance } from './recurrence'

export type PeriodUnit = 'week' | 'month'

type PeriodTask = Pick<
  Task,
  'id' | 'startAt' | 'allDay' | 'recurrenceRule' | 'recurrenceMode' | 'rotation' | 'assigneeIds' | 'period'
>

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Hat die Aufgabe einen Zeitraum statt eines festen Tages? */
export function isPeriodTask(t: Pick<Task, 'period' | 'startAt'>): boolean {
  return !!t.period && !!t.startAt
}

/** Erster Tag des Zeitraums, in dem das Datum liegt (Montag bzw. Monatserster) */
export function periodStartOf(date: string, unit: PeriodUnit): string {
  if (unit === 'month') return `${date.slice(0, 7)}-01`
  return addDays(date.slice(0, 10), -weekdayIndex(date))
}

/** Monatserster + n Monate */
function addMonthStarts(start: string, n: number): string {
  const total = Number(start.slice(0, 4)) * 12 + Number(start.slice(5, 7)) - 1 + n
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`
}

/** Nächster Zeitraum gleicher Länge */
export function nextPeriodStart(start: string, unit: PeriodUnit, n = 1): string {
  return unit === 'week' ? addDays(start, 7 * n) : addMonthStarts(start, n)
}

/** Abstand der Serie (alle n Wochen/Monate), einmalig = 1 */
export function periodInterval(t: Pick<Task, 'recurrenceRule' | 'startAt'>): number {
  if (!t.recurrenceRule || !t.startAt) return 1
  return parseRule(t.recurrenceRule, t.startAt.slice(0, 10)).interval
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
  if (n > 1) parts.push(`INTERVAL=${n}`)
  if (unit === 'week') parts.push('BYDAY=MO')
  return parts.join(';')
}

/** „Jede Woche“, „Alle 2 Monate“, „Einmalig“ */
export function describePeriodRepeat(unit: PeriodUnit, interval: number | null): string {
  if (!interval) return 'Einmalig'
  if (unit === 'week') return interval === 1 ? 'Jede Woche' : `Alle ${interval} Wochen`
  if (interval === 12) return 'Jedes Jahr'
  return interval === 1 ? 'Jeden Monat' : `Alle ${interval} Monate`
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
 * Name eines Zeitraums: „Diese Woche“, „Nächste Woche“, „30.11.–06.12.“, „Dezember“, „Dezember–Januar 2027“.
 */
export function periodLabel(range: { from: string; to: string }, unit: PeriodUnit, today: string): string {
  const { from, to } = range
  if (unit === 'month') {
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
  const reach = t.period === 'month' ? 31 * n : 7 * n
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
