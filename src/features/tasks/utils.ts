// Reine Aufgabenlogik: Datum/Zeit, Filter, Sortierung, Gruppierung, Heute-Ansicht.

import type { ChecklistItem, Occurrence, Priority, Task } from '@/types/data'
import { addDays, formatDay } from '@/lib/dates'
import { newBase, touch } from '@/lib/records'
import {
  doneInstances,
  expandRange,
  isSeries,
  nextOpen,
  occurrenceId,
  overdueInstance,
  type Instance,
} from '@/lib/recurrence'
import { isPeriodTask, periodInstances, periodLabel, periodRange, periodStartOf, type PeriodUnit } from '@/lib/periods'

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240]

export function formatDuration(min: number): string {
  if (min < 60) return `${min} Min.`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`
}

// ---------- Datum und Uhrzeit ----------

/** JJJJ-MM-TT oder null (Inbox) */
export function taskDate(t: Pick<Task, 'startAt'>): string | null {
  return t.startAt ? t.startAt.slice(0, 10) : null
}

/** HH:MM oder null (ganztägig / Inbox) */
export function taskTime(t: Pick<Task, 'startAt' | 'allDay'>): string | null {
  if (!t.startAt || t.allDay || t.startAt.length < 16) return null
  return t.startAt.slice(11, 16)
}

/** Aus Formularwerten: Datum leer → Inbox, Uhrzeit leer → ganztägig */
export function buildStartAt(date: string, time: string): { startAt: string | null; allDay: boolean } {
  if (!date) return { startAt: null, allDay: false }
  if (!time) return { startAt: date, allDay: true }
  return { startAt: `${date}T${time}`, allDay: false }
}

export function isInbox(t: Task): boolean {
  return !t.startAt
}

export function isOverdue(t: Task, today: string): boolean {
  const range = taskPeriod(t)
  if (range) return t.status === 'open' && range.to < today
  const d = taskDate(t)
  return t.status === 'open' && d !== null && d < today
}

/** Zeitraum einer Aufgabe bzw. eines Serien-Zeitraums (startAt = erster Tag); null = fester Tag */
export function taskPeriod(t: Pick<Task, 'period' | 'startAt' | 'recurrenceRule'>): { from: string; to: string } | null {
  if (!isPeriodTask(t)) return null
  return periodRange(t, t.startAt!.slice(0, 10))
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.done).length, total: items.length }
}

// ---------- Anlegen ----------

export type TaskInput = Pick<
  Task,
  | 'title'
  | 'description'
  | 'roomId'
  | 'priority'
  | 'startAt'
  | 'allDay'
  | 'durationMin'
  | 'assigneeIds'
  | 'checklist'
  | 'recurrenceRule'
  | 'recurrenceMode'
  | 'rotation'
  | 'reminderTimes'
  | 'period'
>

export function createTask(input: TaskInput, personId: string | null): Task {
  return {
    ...newBase(personId),
    ...input,
    // Eine Serie und ein Zeitraum brauchen einen Starttermin
    recurrenceRule: input.startAt ? input.recurrenceRule : null,
    period: input.startAt ? (input.period ?? null) : null,
    status: 'open',
    completedAt: null,
  }
}

// ---------- Serien → einzelne Termine ----------

/**
 * Aufgabe, wie sie in Listen erscheint. Bei Serien ein einzelner Termin:
 * startAt, status, completedAt und assigneeIds gelten für diesen Termin.
 */
export interface TaskInstance extends Task {
  /** ursprüngliches Datum des Termins (nur bei Serien) */
  occurrenceDate?: string
  /** Termin wurde einzeln verschoben */
  moved?: boolean
  /** wer den Termin abgehakt hat */
  completedBy?: string | null
}

export function toTaskInstance(t: Task, i: Instance): TaskInstance {
  return {
    ...t,
    startAt: i.startAt,
    allDay: i.allDay,
    status: i.status,
    completedAt: i.completedAt,
    assigneeIds: i.assigneeIds,
    occurrenceDate: i.date,
    moved: i.moved,
    completedBy: i.completedBy,
  }
}

/** Schlüssel für React-Listen */
export function instanceKey(t: TaskInstance): string {
  return t.occurrenceDate ? `${t.id}:${t.occurrenceDate}` : t.id
}

/** Link zur Bearbeitung (bei Serien mit Termin) */
export function taskLink(t: TaskInstance): string {
  return t.occurrenceDate ? `/aufgaben/${t.id}?datum=${t.occurrenceDate}` : `/aufgaben/${t.id}`
}

/**
 * Für Listen (Heute, Geplant, Zeitraum, Erledigt): einmalige Aufgaben unverändert, Serien als einzelne Termine:
 * der letzte verpasste (überfällig), alle von heute und morgen, der nächste offene und alle erledigten.
 * Zeitraum-Serien: der laufende Zeitraum, ggf. der nächste und alle erledigten (siehe periodInstances).
 */
export function listInstances(tasks: Task[], occurrences: Occurrence[], today: string): TaskInstance[] {
  const out: TaskInstance[] = []
  for (const t of tasks) {
    if (t.deleted) continue
    if (!isSeries(t)) {
      out.push(t)
      continue
    }
    if (isPeriodTask(t)) {
      for (const i of periodInstances(t, occurrences, today)) out.push(toTaskInstance(t, i))
      continue
    }
    const byDate = new Map<string, Instance>()
    const add = (i: Instance | null) => {
      if (i) byDate.set(i.date, i)
    }
    add(overdueInstance(t, occurrences, today))
    expandRange(t, occurrences, today, addDays(today, 1)).forEach(add)
    add(nextOpen(t, occurrences, today))
    doneInstances(t, occurrences).forEach(add)
    for (const i of byDate.values()) out.push(toTaskInstance(t, i))
  }
  return out
}

/** Occurrence anlegen oder ändern (deterministische id, gelöschte werden wiederbelebt). */
export function upsertOccurrence(
  list: Occurrence[],
  taskId: string,
  date: string,
  personId: string | null,
  changes: Partial<Occurrence>,
): Occurrence[] {
  const id = occurrenceId(taskId, date)
  const existing = list.find((o) => o.id === id)
  if (existing) {
    return list.map((o) => (o.id === id ? touch(o, personId, { deleted: false, ...changes }) : o))
  }
  const rec: Occurrence = {
    ...newBase(personId),
    id,
    taskId,
    originalDate: date,
    movedTo: null,
    status: 'open',
    completedAt: null,
    completedBy: null,
    assigneeId: null,
    ...changes,
  }
  return [...list, rec]
}

// ---------- Filter ----------

export type TaskView = 'planned' | 'period' | 'inbox' | 'done'

export interface TaskFilter {
  view: TaskView
  roomId: string | null
  personId: string | null
  /** nur Aufgaben, die meId zugewiesen sind */
  mineOnly: boolean
  meId: string | null
}

export function matchesFilter(t: Task, f: Omit<TaskFilter, 'view'>): boolean {
  if (t.deleted) return false
  if (f.roomId && t.roomId !== f.roomId) return false
  if (f.personId && !t.assigneeIds.includes(f.personId)) return false
  if (f.mineOnly && (!f.meId || !t.assigneeIds.includes(f.meId))) return false
  return true
}

export function inView(t: Task, view: TaskView): boolean {
  if (view === 'done') return t.status === 'done'
  if (view === 'inbox') return t.status === 'open' && !t.startAt
  if (view === 'period') return t.status === 'open' && isPeriodTask(t)
  return t.status === 'open' && !!t.startAt && !isPeriodTask(t)
}

export function filterTasks(tasks: TaskInstance[], f: TaskFilter): TaskInstance[] {
  const out = tasks.filter((t) => inView(t, f.view) && matchesFilter(t, f))
  return f.view === 'done' ? sortDone(out) : sortTasks(out)
}

// ---------- Sortierung ----------

/** Nach Datum, dann ganztägig vor Uhrzeit, dann Priorität, dann Titel. Inbox nach Priorität/Erstellung. */
export function sortTasks(tasks: TaskInstance[]): TaskInstance[] {
  return [...tasks].sort((a, b) => {
    const da = taskDate(a) ?? '9999'
    const db = taskDate(b) ?? '9999'
    if (da !== db) return da < db ? -1 : 1
    const ta = taskTime(a) ?? ''
    const tb = taskTime(b) ?? ''
    if (ta !== tb) return ta < tb ? -1 : 1
    const pa = PRIORITY_RANK[a.priority] ?? 1
    const pb = PRIORITY_RANK[b.priority] ?? 1
    if (pa !== pb) return pa - pb
    return a.title.localeCompare(b.title, 'de')
  })
}

/** Erledigte: zuletzt erledigt zuerst */
export function sortDone(tasks: TaskInstance[]): TaskInstance[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

// ---------- Gruppierung ----------

export interface TaskGroup {
  key: string
  label: string
  overdue?: boolean
  tasks: TaskInstance[]
}

/** Geplante Aufgaben nach Tag gruppieren, überfällige zuerst in einer eigenen Gruppe. */
export function groupByDay(tasks: TaskInstance[], today: string): TaskGroup[] {
  const groups: TaskGroup[] = []
  const overdue = tasks.filter((t) => isOverdue(t, today))
  if (overdue.length) groups.push({ key: 'overdue', label: 'Überfällig', overdue: true, tasks: overdue })
  const byDay = new Map<string, TaskInstance[]>()
  for (const t of tasks) {
    if (isOverdue(t, today)) continue
    const d = taskDate(t)
    if (!d) continue
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(t)
  }
  for (const [d, list] of [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    groups.push({ key: d, label: formatDay(d, today), tasks: list })
  }
  return groups
}

/**
 * Zeitraum-Aufgaben gruppieren: überfällige (einmalige, deren Zeitraum vorbei ist), dann laufende,
 * dann kommende, jeweils nach Zeitraum („Diese Woche“, „Dezember“ …).
 */
export function groupByPeriod(tasks: TaskInstance[], today: string): TaskGroup[] {
  const groups: TaskGroup[] = []
  const overdue = tasks.filter((t) => isOverdue(t, today))
  if (overdue.length) groups.push({ key: 'overdue', label: 'Überfällig', overdue: true, tasks: overdue })
  const byRange = new Map<string, { range: { from: string; to: string }; unit: PeriodUnit; tasks: TaskInstance[] }>()
  for (const t of tasks) {
    const range = taskPeriod(t)
    if (!range || isOverdue(t, today)) continue
    const key = `${range.from}|${range.to}`
    if (!byRange.has(key)) byRange.set(key, { range, unit: t.period ?? 'week', tasks: [] })
    byRange.get(key)!.tasks.push(t)
  }
  const sorted = [...byRange.entries()].sort(([, a], [, b]) => {
    const ca = a.range.from <= today ? 0 : 1
    const cb = b.range.from <= today ? 0 : 1
    if (ca !== cb) return ca - cb
    if (a.range.to !== b.range.to) return a.range.to < b.range.to ? -1 : 1
    return a.range.from < b.range.from ? -1 : 1
  })
  for (const [key, g] of sorted) {
    const label = periodLabel(g.range, g.unit, today)
    const suffix = g.range.from > today ? ` · ab ${formatDay(g.range.from, today)}` : ''
    groups.push({ key, label: `${label}${suffix}`, tasks: g.tasks })
  }
  return groups
}

/** Liegt today im Zeitraum (oder ist er schon vorbei)? Für die Heute-Ansicht. */
export function periodStarted(t: Task, today: string): boolean {
  const range = taskPeriod(t)
  return !!range && range.from <= today
}

/** Für das Formular: Auswahl der nächsten Wochen bzw. Monate */
export function periodChoices(unit: PeriodUnit, today: string, count: number): Array<{ from: string; label: string }> {
  const out: Array<{ from: string; label: string }> = []
  let from = periodStartOf(today, unit)
  for (let i = 0; i < count; i++) {
    const range = periodRange({ period: unit, recurrenceRule: null, startAt: from }, from)
    const name = periodLabel(range, unit, today)
    const withDates =
      (unit === 'week' && (name === 'Diese Woche' || name === 'Nächste Woche')) || unit === 'quarter' || unit === 'half'
    const dates = withDates
      ? ` (${range.from.slice(8, 10)}.${range.from.slice(5, 7)}.–${range.to.slice(8, 10)}.${range.to.slice(5, 7)}.)`
      : ''
    out.push({ from, label: `${name}${dates}` })
    from = addDays(range.to, 1)
  }
  return out
}

// ---------- Heute-Ansicht ----------

export interface TodayBuckets {
  overdue: TaskInstance[]
  today: TaskInstance[]
  /** Zeitraum-Aufgaben, deren Zeitraum läuft */
  period: TaskInstance[]
  /** heute erledigt (fällig heute oder heute abgehakt) */
  doneToday: TaskInstance[]
  inboxCount: number
  tomorrowCount: number
}

export function todayBuckets(
  tasks: TaskInstance[],
  today: string,
  f: Pick<TaskFilter, 'mineOnly' | 'meId'>,
  completedDay: (iso: string) => string,
): TodayBuckets {
  const filter = { roomId: null, personId: null, mineOnly: f.mineOnly, meId: f.meId }
  const relevant = tasks.filter((t) => matchesFilter(t, filter))
  const open = relevant.filter((t) => t.status === 'open')
  const tomorrow = addDays(today, 1)
  return {
    overdue: sortTasks(open.filter((t) => isOverdue(t, today))),
    today: sortTasks(open.filter((t) => !isPeriodTask(t) && taskDate(t) === today)),
    period: sortByPeriodEnd(open.filter((t) => periodStarted(t, today) && !isOverdue(t, today))),
    doneToday: sortDone(
      relevant.filter(
        (t) =>
          t.status === 'done' &&
          ((!isPeriodTask(t) && taskDate(t) === today) ||
            (t.completedAt !== null && completedDay(t.completedAt) === today)),
      ),
    ),
    inboxCount: open.filter((t) => !t.startAt).length,
    tomorrowCount: open.filter((t) => !isPeriodTask(t) && taskDate(t) === tomorrow).length,
  }
}

/** Zeitraum-Aufgaben: was zuerst endet, zuerst; dann Priorität und Titel */
function sortByPeriodEnd(tasks: TaskInstance[]): TaskInstance[] {
  return [...tasks].sort((a, b) => {
    const ea = taskPeriod(a)?.to ?? ''
    const eb = taskPeriod(b)?.to ?? ''
    if (ea !== eb) return ea < eb ? -1 : 1
    const pa = PRIORITY_RANK[a.priority] ?? 1
    const pb = PRIORITY_RANK[b.priority] ?? 1
    if (pa !== pb) return pa - pb
    return a.title.localeCompare(b.title, 'de')
  })
}
