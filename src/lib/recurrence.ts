// Wiederholungen: RRULE lesen/schreiben, Termine einer Serie berechnen, Rotation.
//
// Reine Logik ohne React und ohne Store. Die Erinnerungen in Phase 6 (scripts/notify.mjs)
// müssen dieselben Regeln verwenden.
//
// Zeiten: startAt ist lokale Wandzeit ohne Zeitzone ("2026-11-21" oder "2026-11-21T10:00").
// rrule.js rechnet hier „schwebend“: Wandzeit wird als UTC-Zeitpunkt abgebildet und nach der
// Berechnung wieder als Wandzeit gelesen. So gibt es keine Sommerzeit-Verschiebungen.

import { RRule, type Options } from 'rrule'
import type { Occurrence, RecurrenceMode, Task } from '@/types/data'

// ---------- Typen ----------

export type Freq = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly'
/** Monatlich: am selben Tag (15.), am n-ten Wochentag (3. Freitag) oder am letzten Wochentag */
export type MonthlyMode = 'day' | 'nth' | 'last'

export interface RecurrenceSpec {
  freq: Freq
  /** alle N Tage/Wochen/Monate/Jahre */
  interval: number
  /** Wöchentlich: Wochentage, 0 = Mo … 6 = So */
  byWeekday: number[]
  monthly: MonthlyMode
  /** letzter möglicher Tag (JJJJ-MM-TT) oder null */
  until: string | null
}

/** Ein berechneter Termin einer Serie */
export interface Instance {
  /** ursprüngliches Datum laut Regel (JJJJ-MM-TT), Schlüssel für occurrences */
  date: string
  /** tatsächlicher Beginn (ggf. verschoben), im startAt-Format */
  startAt: string
  allDay: boolean
  status: 'open' | 'done'
  completedAt: string | null
  completedBy: string | null
  assigneeIds: string[]
  moved: boolean
}

type SeriesTask = Pick<Task, 'id' | 'startAt' | 'allDay' | 'recurrenceRule' | 'recurrenceMode' | 'rotation' | 'assigneeIds'>

const CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const WEEKDAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

const pad = (n: number) => String(n).padStart(2, '0')

// ---------- Datumshelfer (reine Kalenderdaten) ----------

function ymd(date: string): [number, number, number] {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return [y, m, d]
}

/** 0 = Mo … 6 = So */
export function weekdayIndex(date: string): number {
  const [y, m, d] = ymd(date)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** n-ter Wochentag im Monat (1–5) */
export function nthOfMonth(date: string): number {
  return Math.ceil(ymd(date)[2] / 7)
}

/** true, wenn es der letzte dieser Wochentage im Monat ist */
export function isLastOfMonth(date: string): boolean {
  const [y, m, d] = ymd(date)
  return d + 7 > daysInMonth(y, m)
}

function dayDiff(a: string, b: string): number {
  const [y1, m1, d1] = ymd(a)
  const [y2, m2, d2] = ymd(b)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

function shiftDate(date: string, days: number): string {
  const [y, m, d] = ymd(date)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function addMonths(date: string, months: number): string {
  const [y, m, d] = ymd(date)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${pad(nm)}-${pad(Math.min(d, daysInMonth(ny, nm)))}`
}

/** startAt → schwebender UTC-Zeitpunkt */
function toFloating(startAt: string): Date {
  const [y, m, d] = ymd(startAt)
  const [h, mi] = startAt.length >= 16 ? startAt.slice(11, 16).split(':').map(Number) : [0, 0]
  return new Date(Date.UTC(y, m - 1, d, h, mi))
}

function floatingDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function timeOf(startAt: string | null, allDay: boolean): string | null {
  if (!startAt || allDay || startAt.length < 16) return null
  return startAt.slice(11, 16)
}

function withTime(date: string, time: string | null): string {
  return time ? `${date}T${time}` : date
}

// ---------- Spec ↔ RRULE ----------

export function defaultSpec(freq: Freq, startDate: string): RecurrenceSpec {
  return {
    freq,
    interval: 1,
    byWeekday: freq === 'weekdays' ? [0, 1, 2, 3, 4] : [weekdayIndex(startDate)],
    monthly: 'day',
    until: null,
  }
}

/** RRULE-Text (ohne DTSTART) aus der Spec. Der Starttermin liefert Tag/Wochentag für „monatlich“. */
export function buildRule(spec: RecurrenceSpec, startDate: string, mode: RecurrenceMode = 'fixed'): string {
  const parts: string[] = []
  const interval = Math.max(1, Math.floor(spec.interval) || 1)
  const afterCompletion = mode === 'after_completion'
  switch (spec.freq) {
    case 'daily':
      parts.push('FREQ=DAILY')
      break
    case 'weekdays':
      if (afterCompletion) parts.push('FREQ=DAILY')
      else parts.push('FREQ=WEEKLY', 'BYDAY=MO,TU,WE,TH,FR')
      break
    case 'weekly': {
      parts.push('FREQ=WEEKLY')
      break
    }
    case 'monthly':
      parts.push('FREQ=MONTHLY')
      break
    case 'yearly':
      parts.push('FREQ=YEARLY')
      break
  }
  if (spec.freq !== 'weekdays' && interval > 1) parts.push(`INTERVAL=${interval}`)
  if (!afterCompletion) {
    if (spec.freq === 'weekly') {
      const days = [...new Set(spec.byWeekday.length ? spec.byWeekday : [weekdayIndex(startDate)])].sort()
      parts.push(`BYDAY=${days.map((i) => CODES[i]).join(',')}`)
    }
    if (spec.freq === 'monthly' && spec.monthly !== 'day') {
      const wd = CODES[weekdayIndex(startDate)]
      parts.push(`BYDAY=${spec.monthly === 'last' ? '-1' : nthOfMonth(startDate)}${wd}`)
    }
    if (spec.until) parts.push(`UNTIL=${spec.until.replace(/-/g, '')}T235959Z`)
  }
  return parts.join(';')
}

function ruleParts(rule: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const part of rule.replace(/^RRULE:/i, '').split(';')) {
    const [k, v] = part.split('=')
    if (k && v !== undefined) map.set(k.trim().toUpperCase(), v.trim().toUpperCase())
  }
  return map
}

/** RRULE-Text → Spec (für den Editor). Unbekanntes wird bestmöglich abgebildet. */
export function parseRule(rule: string, startDate: string): RecurrenceSpec {
  const p = ruleParts(rule)
  const interval = Math.max(1, Number(p.get('INTERVAL') ?? 1) || 1)
  const byday = p.get('BYDAY')?.split(',').filter(Boolean) ?? []
  const untilRaw = p.get('UNTIL')
  const until = untilRaw ? `${untilRaw.slice(0, 4)}-${untilRaw.slice(4, 6)}-${untilRaw.slice(6, 8)}` : null
  const spec = { ...defaultSpec('daily', startDate), interval, until }
  switch (p.get('FREQ')) {
    case 'WEEKLY': {
      const days = byday.map((c) => CODES.indexOf(c.slice(-2))).filter((i) => i >= 0)
      if (interval === 1 && days.length === 5 && [0, 1, 2, 3, 4].every((i) => days.includes(i))) {
        return { ...spec, freq: 'weekdays', byWeekday: [0, 1, 2, 3, 4] }
      }
      return { ...spec, freq: 'weekly', byWeekday: days.length ? days.sort() : [weekdayIndex(startDate)] }
    }
    case 'MONTHLY': {
      const ord = byday[0]?.match(/^([+-]?\d+)/)?.[1]
      const monthly: MonthlyMode = !ord ? 'day' : Number(ord) < 0 ? 'last' : 'nth'
      return { ...spec, freq: 'monthly', monthly }
    }
    case 'YEARLY':
      return { ...spec, freq: 'yearly' }
    default:
      return { ...spec, freq: 'daily' }
  }
}

// ---------- Beschreibung (deutsch) ----------

const UNIT: Record<'daily' | 'weekly' | 'monthly' | 'yearly', [string, string]> = {
  daily: ['Tag', 'Tage'],
  weekly: ['Woche', 'Wochen'],
  monthly: ['Monat', 'Monate'],
  yearly: ['Jahr', 'Jahre'],
}

function formatShort(date: string): string {
  const [, m, d] = ymd(date)
  return `${pad(d)}.${pad(m)}.`
}

/** z. B. „Jede Woche am Sa“, „Alle 2 Monate am letzten Freitag“, „3 Tage nach Erledigung“ */
export function describeRule(rule: string, startDate: string, mode: RecurrenceMode = 'fixed'): string {
  const spec = parseRule(rule, startDate)
  const n = spec.interval
  if (mode === 'after_completion') {
    const unit = UNIT[spec.freq === 'weekdays' ? 'daily' : spec.freq]
    return `${n} ${n === 1 ? unit[0] : unit[1]} nach Erledigung`
  }
  let text: string
  switch (spec.freq) {
    case 'daily':
      text = n === 1 ? 'Täglich' : `Alle ${n} Tage`
      break
    case 'weekdays':
      text = 'Werktags (Mo–Fr)'
      break
    case 'weekly':
      text = `${n === 1 ? 'Jede Woche' : `Alle ${n} Wochen`} am ${spec.byWeekday.map((i) => WEEKDAY_SHORT[i]).join(', ')}`
      break
    case 'monthly': {
      const p = n === 1 ? 'Jeden Monat' : `Alle ${n} Monate`
      text = `${p} ${monthlyLabel(spec.monthly, startDate)}`
      break
    }
    case 'yearly':
      text = `${n === 1 ? 'Jedes Jahr' : `Alle ${n} Jahre`} am ${formatShort(startDate)}`
      break
  }
  if (spec.until) text += ` bis ${formatShort(spec.until)}${spec.until.slice(0, 4)}`
  return text
}

/** „am 15.“, „am 3. Freitag“, „am letzten Freitag“ */
export function monthlyLabel(mode: MonthlyMode, startDate: string): string {
  const wd = WEEKDAY_LONG[weekdayIndex(startDate)]
  if (mode === 'last') return `am letzten ${wd}`
  if (mode === 'nth') return `am ${nthOfMonth(startDate)}. ${wd}`
  return `am ${ymd(startDate)[2]}.`
}

// ---------- Regel auswerten ----------

export function isSeries(t: Pick<Task, 'recurrenceRule' | 'startAt'>): boolean {
  return !!t.recurrenceRule && !!t.startAt
}

export function isFixedSeries(t: Pick<Task, 'recurrenceRule' | 'startAt' | 'recurrenceMode'>): boolean {
  return isSeries(t) && t.recurrenceMode !== 'after_completion'
}

const ruleCache = new Map<string, RRule>()

function rruleOf(t: SeriesTask): RRule {
  const key = `${t.startAt}|${t.recurrenceRule}`
  let r = ruleCache.get(key)
  if (!r) {
    const opts: Partial<Options> = RRule.parseString(t.recurrenceRule!.replace(/^RRULE:/i, ''))
    r = new RRule({ ...opts, dtstart: toFloating(t.startAt!) })
    if (ruleCache.size > 500) ruleCache.clear()
    ruleCache.set(key, r)
  }
  return r
}

const dayStart = (date: string) => toFloating(date)
const dayEnd = (date: string) => new Date(toFloating(date).getTime() + 86_400_000 - 1)

/** Ursprüngliche Termine (JJJJ-MM-TT) im Zeitraum [from, to], höchstens limit Stück */
export function datesBetween(t: SeriesTask, from: string, to: string, limit = 1000): string[] {
  if (!isSeries(t) || from > to) return []
  const out: string[] = []
  rruleOf(t).between(dayStart(from), dayEnd(to), true, (d) => {
    out.push(floatingDate(d))
    return out.length < limit
  })
  return out
}

/** Gehört das Datum zur Regel? */
export function isRuleDate(t: SeriesTask, date: string): boolean {
  return datesBetween(t, date, date, 1).length === 1
}

/** Position des Termins in der Serie (0 = erster Termin) */
export function instanceIndex(t: SeriesTask, date: string): number {
  if (!isSeries(t)) return 0
  const start = t.startAt!.slice(0, 10)
  if (date <= start) return 0
  // Ende 1 ms vor Mitternacht, sonst zählt ein ganztägiger Termin am Datum selbst mit
  return rruleOf(t).between(dayStart(start), new Date(dayStart(date).getTime() - 1), true).length
}

// ---------- Rotation ----------

function occKey(taskId: string, date: string): string {
  return `${taskId}:${date}`
}

/** Deterministische id einer Occurrence, damit beide Geräte denselben Datensatz anlegen */
export function occurrenceId(taskId: string, date: string): string {
  return occKey(taskId, date)
}

/** Occurrences einer Aufgabe nach Datum (ohne gelöschte) */
export function occurrenceMap(occurrences: Occurrence[], taskId: string): Map<string, Occurrence> {
  const map = new Map<string, Occurrence>()
  for (const o of occurrences) if (o.taskId === taskId && !o.deleted) map.set(o.originalDate, o)
  return map
}

/** Zuständige für einen Termin: eigene Zuweisung > Rotation > alle der Serie */
export function assigneesFor(
  t: SeriesTask,
  occs: Map<string, Occurrence>,
  date: string,
  index?: number,
): string[] {
  const occ = occs.get(date)
  if (occ?.assigneeId) return [occ.assigneeId]
  if (!t.rotation || t.assigneeIds.length < 2) return t.assigneeIds
  const n = t.assigneeIds.length
  let i: number
  if (t.recurrenceMode === 'after_completion') {
    i = [...occs.values()].filter((o) => o.status === 'done' && o.originalDate < date).length
  } else {
    i = index ?? instanceIndex(t, date)
  }
  return [t.assigneeIds[i % n]]
}

// ---------- Termine berechnen ----------

function makeInstance(
  t: SeriesTask,
  occs: Map<string, Occurrence>,
  date: string,
  index?: number,
): Instance | null {
  const occ = occs.get(date)
  if (occ?.status === 'skipped') return null
  const time = timeOf(t.startAt, t.allDay)
  const startAt = occ?.movedTo ?? withTime(date, time)
  return {
    date,
    startAt,
    allDay: startAt.length < 16,
    status: occ?.status === 'done' ? 'done' : 'open',
    completedAt: occ?.status === 'done' ? occ.completedAt : null,
    completedBy: occ?.status === 'done' ? occ.completedBy : null,
    assigneeIds: assigneesFor(t, occs, date, index),
    moved: !!occ?.movedTo,
  }
}

/** Ein bestimmter Termin der Serie (auch verschoben/erledigt); null, wenn es ihn nicht gibt */
export function instanceAt(t: SeriesTask, occurrences: Occurrence[], date: string): Instance | null {
  if (!isSeries(t)) return null
  const occs = occurrenceMap(occurrences, t.id)
  if (t.recurrenceMode === 'after_completion') {
    const occ = occs.get(date)
    if (occ?.status === 'done') return makeInstance(t, occs, date)
    if (t.startAt!.slice(0, 10) === date) return currentAfterCompletion(t, occs)
    return null
  }
  if (!isRuleDate(t, date) && !occs.has(date)) return null
  return makeInstance(t, occs, date)
}

function currentAfterCompletion(t: SeriesTask, occs: Map<string, Occurrence>): Instance {
  const date = t.startAt!.slice(0, 10)
  return {
    date,
    startAt: t.allDay ? date : t.startAt!,
    allDay: t.allDay || t.startAt!.length < 16,
    status: 'open',
    completedAt: null,
    completedBy: null,
    assigneeIds: assigneesFor(t, occs, date),
    moved: false,
  }
}

const effDate = (i: Instance) => i.startAt.slice(0, 10)

/**
 * Alle Termine, die im Zeitraum [from, to] liegen (nach tatsächlichem Datum, also inkl. verschobener).
 * after_completion: der aktuelle offene Termin und erledigte Termine.
 */
export function expandRange(t: SeriesTask, occurrences: Occurrence[], from: string, to: string): Instance[] {
  if (!isSeries(t)) return []
  const occs = occurrenceMap(occurrences, t.id)
  const inRange = (i: Instance) => effDate(i) >= from && effDate(i) <= to
  const out: Instance[] = []

  if (t.recurrenceMode === 'after_completion') {
    for (const o of occs.values()) {
      if (o.status !== 'done') continue
      const inst = makeInstance(t, occs, o.originalDate)
      if (inst && inRange(inst)) out.push(inst)
    }
    const cur = currentAfterCompletion(t, occs)
    if (inRange(cur)) out.push(cur)
    return sortInstances(out)
  }

  const dates = datesBetween(t, from, to)
  const base = dates.length ? instanceIndex(t, dates[0]) : 0
  const seen = new Set<string>()
  dates.forEach((date, i) => {
    seen.add(date)
    const inst = makeInstance(t, occs, date, base + i)
    if (inst && inRange(inst)) out.push(inst)
  })
  // Von außerhalb in den Zeitraum verschobene Termine
  for (const o of occs.values()) {
    if (!o.movedTo || seen.has(o.originalDate)) continue
    const inst = makeInstance(t, occs, o.originalDate)
    if (inst && inRange(inst)) out.push(inst)
  }
  return sortInstances(out)
}

function sortInstances(list: Instance[]): Instance[] {
  return list.sort((a, b) => (a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0))
}

/** Erster offener Termin ab dem Datum (inkl.); sucht bis zu 60 Termine bzw. 5 Jahre voraus. */
export function nextOpen(t: SeriesTask, occurrences: Occurrence[], from: string): Instance | null {
  if (!isSeries(t)) return null
  const occs = occurrenceMap(occurrences, t.id)
  if (t.recurrenceMode === 'after_completion') return currentAfterCompletion(t, occs)
  const candidates: Instance[] = []
  for (const date of datesBetween(t, from, shiftDate(from, 5 * 366), 60)) {
    const inst = makeInstance(t, occs, date)
    if (inst && inst.status === 'open' && effDate(inst) >= from) {
      candidates.push(inst)
      break
    }
  }
  for (const o of occs.values()) {
    if (!o.movedTo || o.status !== 'open' || o.movedTo.slice(0, 10) < from) continue
    const inst = makeInstance(t, occs, o.originalDate)
    if (inst) candidates.push(inst)
  }
  return sortInstances(candidates)[0] ?? null
}

/**
 * Überfälliger Termin: nur der letzte Termin vor heute, und nur, wenn er noch offen ist.
 * Ältere verpasste Termine verfallen still.
 */
export function overdueInstance(t: SeriesTask, occurrences: Occurrence[], today: string): Instance | null {
  if (!isSeries(t)) return null
  const occs = occurrenceMap(occurrences, t.id)
  if (t.recurrenceMode === 'after_completion') {
    const cur = currentAfterCompletion(t, occs)
    return effDate(cur) < today ? cur : null
  }
  const start = t.startAt!.slice(0, 10)
  if (start >= today) return null
  const yesterday = shiftDate(today, -1)
  const candidates: Instance[] = []
  // Letzter Termin laut Regel vor heute
  const last = rruleOf(t).before(dayStart(today), false)
  if (last) {
    const inst = makeInstance(t, occs, floatingDate(last))
    if (inst && effDate(inst) <= yesterday) candidates.push(inst)
  }
  // Verschobene Termine, die jetzt in der Vergangenheit liegen
  for (const o of occs.values()) {
    if (!o.movedTo || o.movedTo.slice(0, 10) > yesterday) continue
    const inst = makeInstance(t, occs, o.originalDate)
    if (inst) candidates.push(inst)
  }
  const latest = sortInstances(candidates).at(-1)
  return latest && latest.status === 'open' ? latest : null
}

/** Erledigte Termine (für „Erledigt“) */
export function doneInstances(t: SeriesTask, occurrences: Occurrence[]): Instance[] {
  if (!isSeries(t)) return []
  const occs = occurrenceMap(occurrences, t.id)
  const out: Instance[] = []
  for (const o of occs.values()) {
    if (o.status !== 'done') continue
    const inst = makeInstance(t, occs, o.originalDate)
    if (inst) out.push(inst)
  }
  return out
}

// ---------- Ändern ----------

/** after_completion: nächster Termin = Erledigungsdatum + Intervall, Uhrzeit bleibt. */
export function nextAfterCompletion(t: SeriesTask, completedDate: string): string {
  const spec = parseRule(t.recurrenceRule ?? 'FREQ=DAILY', completedDate)
  const n = spec.interval
  let date: string
  switch (spec.freq) {
    case 'weekly':
      date = shiftDate(completedDate, 7 * n)
      break
    case 'monthly':
      date = addMonths(completedDate, n)
      break
    case 'yearly':
      date = addMonths(completedDate, 12 * n)
      break
    default:
      date = shiftDate(completedDate, n)
  }
  return withTime(date, timeOf(t.startAt, t.allDay))
}

/**
 * Ganze Serie um einige Tage verschieben: Wochentage wandern mit, „monatlich am n-ten Wochentag“
 * wird aus dem neuen Starttermin neu berechnet.
 */
export function shiftRule(rule: string, oldStart: string, newStart: string): string {
  const days = dayDiff(oldStart, newStart)
  if (days === 0) return rule
  const spec = parseRule(rule, oldStart)
  if (spec.freq === 'weekly') {
    const shift = ((days % 7) + 7) % 7
    spec.byWeekday = spec.byWeekday.map((i) => (i + shift) % 7)
  }
  if (spec.freq === 'monthly' && spec.monthly === 'nth' && nthOfMonth(newStart) > 4) spec.monthly = 'last'
  return buildRule(spec, newStart)
}

/** Neuer Serienstart, wenn ein Termin von origDate nach newDate gezogen wird */
export function shiftedSeriesStart(seriesStart: string, origDate: string, newStartAt: string): string {
  const newDate = newStartAt.slice(0, 10)
  const date = shiftDate(seriesStart.slice(0, 10), dayDiff(origDate, newDate))
  return newStartAt.length >= 16 ? `${date}T${newStartAt.slice(11, 16)}` : date
}
