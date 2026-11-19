// Reine Aufgabenlogik: Datum/Zeit, Filter, Sortierung, Gruppierung, Heute-Ansicht.

import type { ChecklistItem, Priority, Task } from '@/types/data'
import { addDays, formatDay } from '@/lib/dates'
import { newBase } from '@/lib/records'

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
  const d = taskDate(t)
  return t.status === 'open' && d !== null && d < today
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.done).length, total: items.length }
}

// ---------- Anlegen ----------

export type TaskInput = Pick<
  Task,
  'title' | 'description' | 'roomId' | 'priority' | 'startAt' | 'allDay' | 'durationMin' | 'assigneeIds' | 'checklist'
>

export function createTask(input: TaskInput, personId: string | null): Task {
  return {
    ...newBase(personId),
    ...input,
    status: 'open',
    completedAt: null,
    recurrenceRule: null,
    recurrenceMode: 'fixed',
    rotation: false,
  }
}

// ---------- Filter ----------

export type TaskView = 'planned' | 'inbox' | 'done'

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
  return t.status === 'open' && !!t.startAt
}

export function filterTasks(tasks: Task[], f: TaskFilter): Task[] {
  const out = tasks.filter((t) => inView(t, f.view) && matchesFilter(t, f))
  return f.view === 'done' ? sortDone(out) : sortTasks(out)
}

// ---------- Sortierung ----------

/** Nach Datum, dann ganztägig vor Uhrzeit, dann Priorität, dann Titel. Inbox nach Priorität/Erstellung. */
export function sortTasks(tasks: Task[]): Task[] {
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
export function sortDone(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

// ---------- Gruppierung ----------

export interface TaskGroup {
  key: string
  label: string
  overdue?: boolean
  tasks: Task[]
}

/** Geplante Aufgaben nach Tag gruppieren, überfällige zuerst in einer eigenen Gruppe. */
export function groupByDay(tasks: Task[], today: string): TaskGroup[] {
  const groups: TaskGroup[] = []
  const overdue = tasks.filter((t) => isOverdue(t, today))
  if (overdue.length) groups.push({ key: 'overdue', label: 'Überfällig', overdue: true, tasks: overdue })
  const byDay = new Map<string, Task[]>()
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

// ---------- Heute-Ansicht ----------

export interface TodayBuckets {
  overdue: Task[]
  today: Task[]
  /** heute erledigt (fällig heute oder heute abgehakt) */
  doneToday: Task[]
  inboxCount: number
  tomorrowCount: number
}

export function todayBuckets(
  tasks: Task[],
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
    today: sortTasks(open.filter((t) => taskDate(t) === today)),
    doneToday: sortDone(
      relevant.filter(
        (t) =>
          t.status === 'done' &&
          (taskDate(t) === today || (t.completedAt !== null && completedDay(t.completedAt) === today)),
      ),
    ),
    inboxCount: open.filter((t) => !t.startAt).length,
    tomorrowCount: open.filter((t) => taskDate(t) === tomorrow).length,
  }
}
