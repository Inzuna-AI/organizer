// Kalender: reine Logik (Aufgabe → Kalendereintrag, Verschieben → neue Zeit).
import type { Occurrence, Person, Room } from '@/types/data'
import { expandRange, isFixedSeries, isSeries } from '@/lib/recurrence'
import { isPeriodTask } from '@/lib/periods'
import { addDays } from '@/lib/dates'
import { isFamily, type EventInstance } from '@/lib/events'
import type { Holiday } from '@/lib/holidays'
import { toTaskInstance, type TaskInstance } from '@/features/tasks'
import { eventBackground } from '@/features/events'

export type ColorMode = 'room' | 'person'
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export const DEFAULT_TIMED_MIN = 30
export const FALLBACK_COLOR = '#64748b'

const pad = (n: number) => String(n).padStart(2, '0')

/** Lokales Datum als JJJJ-MM-TT bzw. JJJJ-MM-TTTHH:MM (so wird startAt gespeichert). */
export function toLocalString(d: Date, allDay: boolean): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return allDay ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** startAt + Minuten als lokaler String */
export function addMinutes(startAt: string, minutes: number): string {
  const [date, time = '00:00'] = startAt.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return toLocalString(new Date(y, m - 1, d, h, min + minutes), false)
}

/** Lesbare Schriftfarbe (dunkel/weiß) für eine Hintergrundfarbe. */
export function textColorFor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  // Kontrast zu Weiß vs. zu Dunkelgrau (#0f172a, L≈0.0089)
  return (1.05 / (L + 0.05) >= (L + 0.05) / 0.0589) ? '#ffffff' : '#0f172a'
}

export interface EventContext {
  mode: ColorMode
  rooms: Map<string, Room>
  persons: Map<string, Person>
}

export function eventColor(task: TaskInstance, ctx: EventContext): string {
  if (ctx.mode === 'room') return (task.roomId && ctx.rooms.get(task.roomId)?.color) || FALLBACK_COLOR
  const first = task.assigneeIds.map((id) => ctx.persons.get(id)).find(Boolean)
  return first?.color ?? FALLBACK_COLOR
}

export interface TaskEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames: string[]
  durationEditable?: boolean
  extendedProps: {
    kind: 'task'
    badges: Array<{ kuerzel: string; color: string }>
    done: boolean
    icon: string
    taskId: string
    /** ursprüngliches Datum bei Serien-Terminen */
    occurrenceDate?: string
    /** fester Rhythmus: beim Verschieben „Nur diesen Termin / Ganze Serie“ fragen */
    fixedSeries?: boolean
    recurring?: boolean
  }
}

/** Aufgabe → FullCalendar-Eintrag; Aufgaben ohne Datum (Inbox) und gelöschte → null. */
export function taskToEvent(task: TaskInstance, ctx: EventContext): TaskEvent | null {
  if (task.deleted || !task.startAt) return null
  const allDay = task.allDay || task.startAt.length < 16
  const color = eventColor(task, ctx)
  const done = task.status === 'done'
  const room = task.roomId ? ctx.rooms.get(task.roomId) : undefined
  const fixedSeries = !!task.occurrenceDate && isFixedSeries(task)
  return {
    id: task.occurrenceDate ? `${task.id}:${task.occurrenceDate}` : task.id,
    title: task.title,
    start: allDay ? task.startAt.slice(0, 10) : task.startAt,
    end: allDay ? undefined : addMinutes(task.startAt, task.durationMin || DEFAULT_TIMED_MIN),
    allDay,
    // Aufgaben hell mit farbigem Rand (Termine sind vollflächig, siehe eventsToCalendar)
    backgroundColor: `${color}2e`,
    borderColor: color,
    textColor: 'var(--color-slate-900)',
    classNames: done ? ['cal-task', 'task-done'] : ['cal-task'],
    // Die Dauer gilt für die ganze Serie, deshalb Termine nicht einzeln in der Länge ändern
    durationEditable: fixedSeries ? false : undefined,
    extendedProps: {
      kind: 'task',
      // Im Personen-Modus zeigt die Farbe schon die Person → Badges trotzdem für mehrere Zuständige
      badges: task.assigneeIds
        .map((id) => ctx.persons.get(id))
        .filter((p): p is Person => !!p)
        .map((p) => ({ kuerzel: p.kuerzel, color: p.color })),
      done,
      icon: room?.icon ?? '',
      taskId: task.id,
      occurrenceDate: task.occurrenceDate,
      fixedSeries,
      recurring: !!task.recurrenceRule,
    },
  }
}

export interface VisibleRange {
  occurrences: Occurrence[]
  /** JJJJ-MM-TT, inklusive */
  from: string
  to: string
}

/** Einträge für den Kalender; Serien werden für den sichtbaren Zeitraum in Termine aufgelöst. */
export function tasksToEvents(tasks: TaskInstance[], ctx: EventContext, range?: VisibleRange): TaskEvent[] {
  const out: TaskEvent[] = []
  for (const t of tasks) {
    // Aufgaben mit Zeitraum haben keinen festen Tag und stehen nicht im Kalender
    if (t.deleted || isPeriodTask(t)) continue
    if (isSeries(t) && range) {
      for (const i of expandRange(t, range.occurrences, range.from, range.to)) {
        const e = taskToEvent(toTaskInstance(t, i), ctx)
        if (e) out.push(e)
      }
      continue
    }
    const e = taskToEvent(t, ctx)
    if (e) out.push(e)
  }
  return out
}

// ---------- Termine ----------

/** Farbe für Termine der ganzen Familie bzw. ohne bestimmte Personen */
export const FAMILY_COLOR = '#0f766e'

export interface CalEventEntry {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames: string[]
  durationEditable?: boolean
  extendedProps: {
    kind: 'event'
    eventId: string
    /** ursprüngliches Datum bei Serien */
    date: string | null
    recurring: boolean
    /** CSS-Hintergrund (Farbe oder Streifen) */
    background: string
    striped: boolean
    family: boolean
    location: string
    badges: Array<{ kuerzel: string; color: string }>
  }
}

/** Feiertag: Hintergrund des ganzen Tages mit Namen, nicht anklickbar oder verschiebbar */
export interface HolidayEntry {
  id: string
  title: string
  start: string
  allDay: true
  display: 'background'
  classNames: string[]
  editable: false
  extendedProps: { kind: 'holiday' }
}

export type CalendarEntry = TaskEvent | CalEventEntry | HolidayEntry

/** Feiertage → Hintergrund-Einträge (nur in der Zeile „ganztägig“ bzw. im Monatsfeld) */
export function holidaysToCalendar(list: Holiday[]): HolidayEntry[] {
  return list.map((h) => ({
    id: `hol:${h.date}`,
    title: h.name,
    start: h.date,
    allDay: true,
    display: 'background',
    classNames: ['cal-holiday'],
    editable: false,
    extendedProps: { kind: 'holiday' },
  }))
}

/** Termine → Kalendereinträge: vollflächig in Personenfarbe, mehrere Personen gestreift, alle = Familie */
export function eventsToCalendar(list: EventInstance[], persons: Person[]): CalEventEntry[] {
  return list.map((i) => {
    const e = i.event
    const family = e.personIds.length === 0 || isFamily(e.personIds, persons)
    const involved = family ? [] : persons.filter((p) => !p.deleted && e.personIds.includes(p.id))
    const colors = involved.map((p) => p.color)
    const base = family ? FAMILY_COLOR : (colors[0] ?? FALLBACK_COLOR)
    const striped = colors.length > 1
    return {
      id: `ev:${i.date ? `${e.id}:${i.date}` : e.id}`,
      title: e.title,
      start: i.startAt,
      // FullCalendar: Ende ganztägiger Einträge ist exklusiv
      end: i.allDay ? addDays(i.endAt, 1) : i.endAt,
      allDay: i.allDay,
      backgroundColor: base,
      borderColor: base,
      textColor: striped ? '#ffffff' : textColorFor(base),
      classNames: striped ? ['cal-event', 'cal-striped'] : ['cal-event'],
      durationEditable: i.date ? false : undefined,
      extendedProps: {
        kind: 'event',
        eventId: e.id,
        date: i.date,
        recurring: !!e.recurrenceRule,
        background: striped ? eventBackground(colors) : base,
        striped,
        family,
        location: e.location,
        badges: involved.map((p) => ({ kuerzel: p.kuerzel, color: p.color })),
      },
    }
  })
}

export interface MoveChange {
  startAt: string
  allDay: boolean
  durationMin?: number | null
}

/**
 * Neue Zeit nach Verschieben/Größe ändern. Beim Wechsel ganztägig → Uhrzeit bleibt die Dauer erhalten.
 * Bei geänderter Endzeit (Resize) wird die Dauer neu berechnet.
 */
export function moveChange(start: Date, allDay: boolean, end: Date | null, resized = false): MoveChange {
  const change: MoveChange = { startAt: toLocalString(start, allDay), allDay }
  if (resized && end && !allDay) change.durationMin = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000))
  return change
}
