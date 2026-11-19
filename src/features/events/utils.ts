// Termine: reine Hilfen fürs Formular und die Anzeige (ohne React).
import type { CalEvent, Person } from '@/types/data'
import { addMinutesTo, DEFAULT_EVENT_MIN, dayRange, isFamily, minutesBetween, type EventInstance } from '@/lib/events'
import { formatDay } from '@/lib/dates'

export type EventInput = Pick<
  CalEvent,
  'title' | 'location' | 'note' | 'startAt' | 'endAt' | 'allDay' | 'personIds' | 'recurrenceRule' | 'reminderTimes'
>

/** Werte des Formulars (Datum/Uhrzeit getrennt) */
export interface EventFormValues {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
}

/** Gespeicherte Zeiten → Formularwerte */
export function toFormValues(i: Pick<EventInstance, 'startAt' | 'endAt' | 'allDay'>): EventFormValues {
  return {
    startDate: i.startAt.slice(0, 10),
    startTime: i.allDay ? '' : i.startAt.slice(11, 16),
    endDate: i.endAt.slice(0, 10),
    endTime: i.allDay ? '' : i.endAt.slice(11, 16),
    allDay: i.allDay,
  }
}

/** Uhrzeit eines neuen Termins, wenn keine vorgegeben ist (z. B. „+“ oder Monatsansicht) */
export const DEFAULT_EVENT_TIME = '10:00'

/** Voreinstellung für einen neuen Termin: immer mit Uhrzeit, „ganztägig“ ist nicht angehakt */
export function defaultFormValues(date: string, time: string): EventFormValues {
  time ||= DEFAULT_EVENT_TIME
  const end = addMinutesTo(`${date}T${time}`, DEFAULT_EVENT_MIN)
  return { startDate: date, startTime: time, endDate: end.slice(0, 10), endTime: end.slice(11, 16), allDay: false }
}

/** Ende anpassen, wenn der Beginn verschoben wird (Dauer bleibt) */
export function moveStart(v: EventFormValues, startDate: string, startTime: string): EventFormValues {
  if (v.allDay) {
    const days = Math.max(0, minutesBetween(v.startDate, v.endDate || v.startDate) / 1440)
    const end = addMinutesTo(startDate, days * 1440).slice(0, 10)
    return { ...v, startDate, endDate: end }
  }
  const oldStart = `${v.startDate}T${v.startTime || '00:00'}`
  const oldEnd = v.endDate && v.endTime ? `${v.endDate}T${v.endTime}` : addMinutesTo(oldStart, DEFAULT_EVENT_MIN)
  const span = Math.max(5, minutesBetween(oldStart, oldEnd))
  const newStart = `${startDate}T${startTime || v.startTime || '00:00'}`
  const end = addMinutesTo(newStart, span)
  return { ...v, startDate, startTime: startTime || v.startTime, endDate: end.slice(0, 10), endTime: end.slice(11, 16) }
}

/** Formularwerte → gespeicherte Zeiten; null bei ungültiger Eingabe (Ende vor Beginn) */
export function fromFormValues(v: EventFormValues): Pick<CalEvent, 'startAt' | 'endAt' | 'allDay'> | null {
  if (!v.startDate) return null
  if (v.allDay || !v.startTime) {
    const end = v.endDate && v.endDate > v.startDate ? v.endDate : null
    if (v.endDate && v.endDate < v.startDate) return null
    return { startAt: v.startDate, endAt: end, allDay: true }
  }
  const startAt = `${v.startDate}T${v.startTime}`
  const endAt = v.endTime ? `${v.endDate || v.startDate}T${v.endTime}` : null
  if (endAt && endAt <= startAt) return null
  return { startAt, endAt, allDay: false }
}

/** Zeitangabe für Listen: „10:00–11:30“, „ganztägig“, „bis Fr., 21.11.“ */
export function timeLabel(i: EventInstance, day?: string): string {
  const [first, last] = dayRange(i)
  const multi = first !== last
  if (i.allDay) {
    if (!multi) return 'ganztägig'
    return `${formatDay(first)} – ${formatDay(last)}`
  }
  const st = i.startAt.slice(11, 16)
  const en = i.endAt.slice(11, 16)
  if (!multi) return `${st}–${en}`
  if (day && day > first && day < last) return 'ganztägig'
  if (day && day === last && day !== first) return `bis ${en}`
  return `${st} – ${formatDay(last)}, ${en}`
}

/** Personen-Beschriftung: „Familie“, Namen oder „Alle“ */
export function personsLabel(personIds: string[], persons: Person[]): string {
  if (personIds.length === 0 || isFamily(personIds, persons)) return 'Familie'
  const byId = new Map(persons.map((p) => [p.id, p.name]))
  return personIds.map((id) => byId.get(id) ?? '?').join(', ')
}

/** Farben der beteiligten Personen in fester Reihenfolge (wie in der Personenliste) */
export function personColors(personIds: string[], persons: Person[]): string[] {
  return persons.filter((p) => !p.deleted && personIds.includes(p.id)).map((p) => p.color)
}

/** Hintergrund eines Termins: eine Farbe oder Streifen bei mehreren Personen */
export function eventBackground(colors: string[], neutral = '#64748b'): string {
  if (colors.length === 0) return neutral
  if (colors.length === 1) return colors[0]
  const w = 8
  const stops = colors.map((c, i) => `${c} ${i * w}px ${(i + 1) * w}px`).join(', ')
  return `repeating-linear-gradient(135deg, ${stops})`
}
