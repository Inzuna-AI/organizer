// Aufgaben: Daten lesen (Hooks) und ändern (Aktionen).
import { useMemo } from 'react'
import type { DataFile, Occurrence, Task } from '@/types/data'
import { berlinDateString, nowIso } from '@/lib/dates'
import { tombstone, updateById } from '@/lib/records'
import {
  assigneesFor,
  instanceAt,
  isFixedSeries,
  isSeries,
  nextAfterCompletion,
  occurrenceId,
  occurrenceMap,
  shiftedSeriesStart,
  shiftRule,
} from '@/lib/recurrence'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { createTask, listInstances, toTaskInstance, upsertOccurrence, type TaskInput, type TaskInstance } from './utils'

/** Alle Aufgaben inkl. gelöschter (Filter entfernen gelöschte). */
export function useAllTasks(): Task[] {
  const tasks = useAppStore((s) => s.data?.tasks)
  return useMemo(() => tasks ?? [], [tasks])
}

export function useOccurrences(): Occurrence[] {
  const occs = useAppStore((s) => s.data?.occurrences)
  return useMemo(() => occs ?? [], [occs])
}

/** Aufgaben für Listen: Serien als einzelne Termine (siehe listInstances) */
export function useTaskInstances(): TaskInstance[] {
  const tasks = useAllTasks()
  const occs = useOccurrences()
  const today = berlinDateString()
  return useMemo(() => listInstances(tasks, occs, today), [tasks, occs, today])
}

export function useTask(id: string | undefined): Task | null {
  return useAppStore((s) => s.data?.tasks.find((t) => t.id === id && !t.deleted) ?? null)
}

/** Ein Termin einer Serie; null, wenn die Aufgabe keine Serie ist oder es den Termin nicht gibt */
export function useTaskInstance(task: Task | null, date: string | null): TaskInstance | null {
  const occs = useOccurrences()
  return useMemo(() => {
    if (!task || !date || !isSeries(task)) return null
    const inst = instanceAt(task, occs, date)
    return inst ? toTaskInstance(task, inst) : null
  }, [task, date, occs])
}

/** Hat sich etwas geändert, das die Termine der Serie verschiebt? */
function seriesShape(t: Pick<Task, 'startAt' | 'allDay' | 'recurrenceRule' | 'recurrenceMode'>): string {
  return `${t.startAt}|${t.allDay}|${t.recurrenceRule}|${t.recurrenceMode}`
}

/**
 * Wird eine Serie zeitlich umgebaut, passen einzelne Verschiebungen/Übersprünge/Zuweisungen nicht mehr.
 * Erledigte Termine bleiben als Verlauf erhalten.
 */
function dropExceptions(d: DataFile, taskId: string, me: string | null): Occurrence[] {
  return d.occurrences.map((o) =>
    o.taskId === taskId && !o.deleted && o.status !== 'done' ? tombstone(o, me) : o,
  )
}

function findTask(d: DataFile, id: string): Task | undefined {
  return d.tasks.find((t) => t.id === id && !t.deleted)
}

export const taskActions = {
  /** Legt eine Aufgabe an und gibt ihre id zurück. */
  create(input: TaskInput): string {
    const task = createTask(input, currentPersonId())
    updateData((d) => ({ ...d, tasks: [...d.tasks, task] }))
    return task.id
  },

  save(id: string, input: Partial<TaskInput>) {
    const me = currentPersonId()
    updateData((d) => {
      const old = findTask(d, id)
      if (!old) return d
      const next = { ...old, ...input }
      if (!next.startAt) next.recurrenceRule = null
      const reshaped = isSeries(old) && seriesShape(old) !== seriesShape(next)
      return {
        ...d,
        tasks: updateById<Task>(d.tasks, id, me, { ...input, recurrenceRule: next.recurrenceRule }),
        occurrences: reshaped ? dropExceptions(d, id, me) : d.occurrences,
      }
    })
  },

  /** Einmalige Aufgabe abhaken bzw. wieder öffnen */
  setDone(id: string, done: boolean) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      tasks: updateById(d.tasks, id, me, {
        status: done ? 'done' : 'open',
        completedAt: done ? nowIso() : null,
      }),
    }))
  },

  /** Abhaken für Listen: Serien-Termin oder einmalige Aufgabe */
  toggle(t: TaskInstance) {
    const done = t.status !== 'done'
    if (t.occurrenceDate) taskActions.setInstanceDone(t.id, t.occurrenceDate, done)
    else taskActions.setDone(t.id, done)
  },

  /**
   * Einen Termin einer Serie abhaken bzw. wieder öffnen.
   * after_completion: Abhaken legt den nächsten Termin fest (heute + Intervall).
   */
  setInstanceDone(taskId: string, date: string, done: boolean) {
    const me = currentPersonId()
    updateData((d) => {
      const task = findTask(d, taskId)
      if (!task || !isSeries(task)) return d
      const now = nowIso()

      if (isFixedSeries(task)) {
        return {
          ...d,
          occurrences: upsertOccurrence(d.occurrences, taskId, date, me, {
            status: done ? 'done' : 'open',
            completedAt: done ? now : null,
            completedBy: done ? me : null,
          }),
        }
      }

      // after_completion
      const occs = occurrenceMap(d.occurrences, taskId)
      if (done) {
        const assignee = assigneesFor(task, occs, date)
        return {
          ...d,
          occurrences: upsertOccurrence(d.occurrences, taskId, date, me, {
            status: 'done',
            completedAt: now,
            completedBy: me,
            // Wer zuständig war, bleibt im Verlauf (und zählt für die Rotation)
            assigneeId: assignee.length === 1 ? assignee[0] : null,
          }),
          tasks: updateById<Task>(d.tasks, taskId, me, {
            startAt: nextAfterCompletion(task, berlinDateString()),
          }),
        }
      }
      // Wieder öffnen: war es der letzte erledigte, wird er wieder der aktuelle Termin
      const latest = [...occs.values()]
        .filter((o) => o.status === 'done')
        .sort((a, b) => (a.originalDate < b.originalDate ? 1 : -1))[0]
      const id = occurrenceId(taskId, date)
      const time = !task.allDay && task.startAt!.length >= 16 ? task.startAt!.slice(10) : ''
      return {
        ...d,
        occurrences: d.occurrences.map((o) => (o.id === id ? tombstone(o, me) : o)),
        tasks:
          latest?.originalDate === date
            ? updateById<Task>(d.tasks, taskId, me, { startAt: `${date}${time}` })
            : d.tasks,
      }
    })
  },

  /**
   * Nur diesen Termin ändern: Datum/Uhrzeit (movedTo) und/oder Person (assigneeId).
   * startAt gleich dem ursprünglichen Termin hebt die Verschiebung auf.
   */
  saveInstance(taskId: string, date: string, change: { startAt?: string; assigneeId?: string | null }) {
    const me = currentPersonId()
    updateData((d) => {
      const task = findTask(d, taskId)
      if (!task || !isSeries(task)) return d
      const changes: Partial<Occurrence> = {}
      if (change.startAt !== undefined) {
        const time = !task.allDay && task.startAt!.length >= 16 ? task.startAt!.slice(10) : ''
        changes.movedTo = change.startAt === `${date}${time}` ? null : change.startAt
      }
      if (change.assigneeId !== undefined) changes.assigneeId = change.assigneeId
      return { ...d, occurrences: upsertOccurrence(d.occurrences, taskId, date, me, changes) }
    })
  },

  /** Einen Termin der Serie auslassen */
  skipInstance(taskId: string, date: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      occurrences: upsertOccurrence(d.occurrences, taskId, date, me, { status: 'skipped' }),
    }))
  },

  /**
   * Ganze Serie verschieben, so wie ein Termin von origDate nach newStartAt gezogen wurde:
   * Serienstart und Wochentage wandern um denselben Abstand, die neue Uhrzeit gilt für alle.
   */
  moveSeries(taskId: string, origDate: string, newStartAt: string, extra: Partial<TaskInput> = {}) {
    const task = useAppStore.getState().data?.tasks.find((t) => t.id === taskId)
    if (!task?.startAt || !task.recurrenceRule) return
    const startAt = shiftedSeriesStart(task.startAt, origDate, newStartAt)
    const rule = extra.recurrenceRule ?? task.recurrenceRule
    taskActions.save(taskId, {
      ...extra,
      startAt,
      allDay: startAt.length < 16,
      recurrenceRule: rule ? shiftRule(rule, task.startAt.slice(0, 10), startAt.slice(0, 10)) : null,
    })
  },

  toggleChecklistItem(taskId: string, itemId: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      tasks: updateById(d.tasks, taskId, me, (t) => ({
        checklist: t.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
      })),
    }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? tombstone(t, me) : t)) }))
  },
}
