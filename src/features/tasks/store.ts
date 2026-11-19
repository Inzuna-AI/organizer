// Aufgaben: Daten lesen (Hooks) und ändern (Aktionen).
import { useMemo } from 'react'
import type { Task } from '@/types/data'
import { nowIso } from '@/lib/dates'
import { tombstone, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { createTask, type TaskInput } from './utils'

/** Alle Aufgaben inkl. gelöschter (Filter entfernen gelöschte). */
export function useAllTasks(): Task[] {
  const tasks = useAppStore((s) => s.data?.tasks)
  return useMemo(() => tasks ?? [], [tasks])
}

export function useTask(id: string | undefined): Task | null {
  return useAppStore((s) => s.data?.tasks.find((t) => t.id === id && !t.deleted) ?? null)
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
    updateData((d) => ({ ...d, tasks: updateById<Task>(d.tasks, id, me, input) }))
  },

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
