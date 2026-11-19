// Termine: reine Logik (Ende/Dauer, Serien auflösen, Familie). Ohne React, ohne Store.
// Wird von den Features events, calendar, today und von src/notify (Node) genutzt.
//
// Zeiten sind wie bei Aufgaben lokale Wandzeit ohne Zeitzone: "2026-11-20" oder "2026-11-20T10:00".
// Serien rechnen mit lib/recurrence (gleiche RRULE-Logik wie Aufgaben).

import type { CalEvent, EventException, Occurrence, Person } from '@/types/data'
import { addDays } from './dates'
import { expandRange, instanceAt, isSeries, shiftedSeriesStart, shiftRule } from './recurrence'

/** Dauer eines Termins mit Uhrzeit, wenn kein Ende angegeben ist */
export const DEFAULT_EVENT_MIN = 60

/** Ein konkreter Termin (bei Serien ein einzelnes Vorkommen) */
export interface EventInstance {
  event: CalEvent
  /** ursprüngliches Datum bei Serien (Schlüssel für exceptions), sonst null */
  date: string | null
  startAt: string
  /** Ende im selben Format wie startAt (ganztägig: letzter Tag inklusive) */
  endAt: string
  allDay: boolean
  moved: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function toUtc(s: string): number {
  const [date, time = '00:00'] = s.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return Date.UTC(y, m - 1, d, h, min)
}

function fromUtc(ms: number, withTime: boolean): string {
  const d = new Date(ms)
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return withTime ? `${date}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : date
}

/** startAt + Minuten (Wandzeit) */
export function addMinutesTo(startAt: string, minutes: number): string {
  return fromUtc(toUtc(startAt) + minutes * 60_000, true)
}

export function minutesBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 60_000)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b.slice(0, 10)) - toUtc(a.slice(0, 10))) / 86_400_000)
}

const isAllDay = (e: Pick<CalEvent, 'allDay' | 'startAt'>) => e.allDay || e.startAt.length < 16

/** Länge des Termins: Minuten (mit Uhrzeit) bzw. zusätzliche Tage (ganztägig, 0 = ein Tag) */
export function eventSpan(e: Pick<CalEvent, 'allDay' | 'startAt' | 'endAt'>): number {
  if (isAllDay(e)) return e.endAt ? Math.max(0, daysBetween(e.startAt, e.endAt)) : 0
  if (!e.endAt || e.endAt.length < 16) return DEFAULT_EVENT_MIN
  return Math.max(5, minutesBetween(e.startAt, e.endAt))
}

/** Ende zu einem (ggf. verschobenen) Beginn mit der Länge des Termins */
export function endFor(e: Pick<CalEvent, 'allDay' | 'startAt' | 'endAt'>, startAt: string): string {
  const span = eventSpan(e)
  return startAt.length < 16 ? addDays(startAt.slice(0, 10), span) : addMinutesTo(startAt, span)
}

/** Erster und letzter Kalendertag eines Termins (Ende um 0:00 zählt zum Vortag) */
export function dayRange(i: Pick<EventInstance, 'startAt' | 'endAt' | 'allDay'>): [string, string] {
  const first = i.startAt.slice(0, 10)
  if (i.allDay) return [first, i.endAt.slice(0, 10)]
  let last = i.endAt.slice(0, 10)
  if (i.endAt.slice(11) === '00:00' && last > first) last = addDays(last, -1)
  return [first, last < first ? first : last]
}

/** Termin als „Serien-Aufgabe“ für lib/recurrence */
function asSeries(e: CalEvent) {
  return {
    id: e.id,
    startAt: e.startAt,
    allDay: isAllDay(e),
    recurrenceRule: e.recurrenceRule,
    recurrenceMode: 'fixed' as const,
    rotation: false,
    assigneeIds: e.personIds,
  }
}

/** Ausnahmen in der Form, die lib/recurrence erwartet */
function exceptionOccs(e: CalEvent): Occurrence[] {
  return (e.exceptions ?? []).map((x) => ({
    id: `${e.id}:${x.date}`,
    updatedAt: e.updatedAt,
    deleted: false,
    createdBy: null,
    updatedBy: null,
    taskId: e.id,
    originalDate: x.date,
    movedTo: x.movedTo,
    status: x.skipped ? 'skipped' : 'open',
    completedAt: null,
    completedBy: null,
    assigneeId: null,
  }))
}

function single(e: CalEvent): EventInstance {
  const allDay = isAllDay(e)
  const startAt = allDay ? e.startAt.slice(0, 10) : e.startAt
  return { event: e, date: null, startAt, endAt: endFor(e, startAt), allDay, moved: false }
}

/** Alle Vorkommen eines Termins, die den Zeitraum [from, to] (JJJJ-MM-TT, inklusive) berühren */
export function eventInstances(e: CalEvent, from: string, to: string): EventInstance[] {
  if (e.deleted || !e.startAt) return []
  const overlaps = (i: EventInstance) => {
    const [a, b] = dayRange(i)
    return a <= to && b >= from
  }
  if (!isSeries(e)) {
    const i = single(e)
    return overlaps(i) ? [i] : []
  }
  // Mehrtägige Termine, die vor dem Zeitraum beginnen, mitnehmen
  const reach = isAllDay(e) ? eventSpan(e) : Math.ceil(eventSpan(e) / 1440)
  return expandRange(asSeries(e), exceptionOccs(e), addDays(from, -reach), to)
    .map((inst) => ({
      event: e,
      date: inst.date,
      startAt: inst.startAt,
      endAt: endFor(e, inst.startAt),
      allDay: inst.allDay,
      moved: inst.moved,
    }))
    .filter(overlaps)
}

/** Ein bestimmtes Vorkommen einer Serie (nach ursprünglichem Datum) */
export function eventInstanceAt(e: CalEvent, date: string): EventInstance | null {
  if (!isSeries(e)) return null
  const inst = instanceAt(asSeries(e), exceptionOccs(e), date)
  if (!inst) return null
  return { event: e, date, startAt: inst.startAt, endAt: endFor(e, inst.startAt), allDay: inst.allDay, moved: inst.moved }
}

/** Termine aller Einträge im Zeitraum, nach Beginn sortiert (ganztägige zuerst) */
export function eventsBetween(events: CalEvent[], from: string, to: string): EventInstance[] {
  const out: EventInstance[] = []
  for (const e of events) out.push(...eventInstances(e, from, to))
  return out.sort(compareInstances)
}

export function compareInstances(a: EventInstance, b: EventInstance): number {
  const da = a.startAt.slice(0, 10)
  const db = b.startAt.slice(0, 10)
  if (da !== db) return da < db ? -1 : 1
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  return a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0
}

/** Schlüssel eines Vorkommens für Listen/Links */
export function instanceKeyOf(i: EventInstance): string {
  return i.date ? `${i.event.id}:${i.date}` : i.event.id
}

// ---------- Personen ----------

/** Ist die Person beteiligt? Termine ohne Personen gelten für alle. */
export function involves(e: Pick<CalEvent, 'personIds'>, personId: string | null): boolean {
  return e.personIds.length === 0 || (!!personId && e.personIds.includes(personId))
}

/** Alle (nicht gelöschten) Personen beteiligt, mindestens zwei → „Familie“ */
export function isFamily(personIds: string[], persons: Person[]): boolean {
  const alive = persons.filter((p) => !p.deleted)
  return alive.length >= 2 && alive.every((p) => personIds.includes(p.id))
}

// ---------- Ändern (rein, für den Store) ----------

/** Ausnahme für ein Vorkommen setzen; ohne Abweichung wird sie entfernt */
export function withException(e: CalEvent, date: string, change: Partial<Omit<EventException, 'date'>>): EventException[] {
  const list = e.exceptions ?? []
  const old = list.find((x) => x.date === date) ?? { date, movedTo: null, skipped: false }
  const next = { ...old, ...change }
  // Zurück auf den ursprünglichen Termin verschoben = keine Verschiebung
  if (next.movedTo) {
    const time = isAllDay(e) ? '' : e.startAt.slice(10, 16)
    if (next.movedTo === `${date}${time}`) next.movedTo = null
  }
  const rest = list.filter((x) => x.date !== date)
  return next.movedTo || next.skipped ? [...rest, next] : rest
}

/**
 * Ganze Serie so verschieben, wie ein Vorkommen von origDate nach newStartAt gezogen wurde.
 * Ende und Wochentage wandern mit; Ausnahmen passen danach nicht mehr und werden verworfen.
 */
export function shiftSeries(
  e: CalEvent,
  origDate: string,
  newStartAt: string,
  /** Neues Ende des gezogenen Vorkommens (ändert die Länge); undefined = Länge bleibt */
  newEndAt?: string | null,
): Pick<CalEvent, 'startAt' | 'endAt' | 'allDay' | 'recurrenceRule' | 'exceptions'> {
  const startAt = shiftedSeriesStart(e.startAt, origDate, newStartAt)
  const allDay = startAt.length < 16
  // Wechsel ganztägig ↔ Uhrzeit: alte Länge passt nicht (Tage vs. Minuten)
  if (newEndAt === undefined && allDay !== isAllDay(e)) newEndAt = null
  const span =
    newEndAt === undefined
      ? eventSpan(e)
      : newEndAt === null
        ? allDay ? 0 : DEFAULT_EVENT_MIN
        : allDay ? Math.max(0, daysBetween(newStartAt, newEndAt)) : Math.max(5, minutesBetween(newStartAt, newEndAt))
  const hasEnd = newEndAt === undefined ? !!e.endAt && !isAllDay(e) : newEndAt !== null
  const endAt = allDay
    ? span > 0 ? addDays(startAt, span) : null
    : hasEnd ? addMinutesTo(startAt, span) : null
  return {
    startAt,
    endAt,
    allDay,
    recurrenceRule: e.recurrenceRule ? shiftRule(e.recurrenceRule, e.startAt.slice(0, 10), startAt.slice(0, 10)) : null,
    exceptions: [],
  }
}

/**
 * Einzelnen (nicht wiederkehrenden) Termin verschieben bzw. in der Länge ändern.
 * newEndAt undefined = Länge bleibt; beim Wechsel ganztägig ↔ Uhrzeit gilt die Standardlänge.
 */
export function movedTimes(
  e: Pick<CalEvent, 'allDay' | 'startAt' | 'endAt'>,
  newStartAt: string,
  newEndAt?: string | null,
): Pick<CalEvent, 'startAt' | 'endAt' | 'allDay'> {
  const allDay = newStartAt.length < 16
  if (newEndAt === undefined) {
    if (allDay !== isAllDay(e)) newEndAt = null
    else if (!e.endAt) newEndAt = null
    else newEndAt = endFor(e, newStartAt)
  }
  if (allDay) return { startAt: newStartAt, endAt: newEndAt && newEndAt.slice(0, 10) > newStartAt ? newEndAt.slice(0, 10) : null, allDay }
  return { startAt: newStartAt, endAt: newEndAt && newEndAt > newStartAt ? newEndAt : null, allDay }
}

/** Hat sich etwas geändert, das die Vorkommen verschiebt? Dann passen Ausnahmen nicht mehr. */
export function seriesReshaped(a: Pick<CalEvent, 'startAt' | 'allDay' | 'recurrenceRule'>, b: Pick<CalEvent, 'startAt' | 'allDay' | 'recurrenceRule'>): boolean {
  return a.startAt !== b.startAt || a.allDay !== b.allDay || a.recurrenceRule !== b.recurrenceRule
}
