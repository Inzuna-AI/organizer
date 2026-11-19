import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/data'
import {
  buildStartAt,
  checklistProgress,
  createTask,
  filterTasks,
  formatDuration,
  groupByDay,
  isOverdue,
  sortTasks,
  taskDate,
  taskTime,
  todayBuckets,
  type TaskInput,
} from './utils'

const TODAY = '2026-11-19'
const sameDay = (iso: string) => iso.slice(0, 10)

let n = 0
function task(over: Partial<Task> = {}): Task {
  const input: TaskInput = {
    title: `Aufgabe ${++n}`,
    description: '',
    roomId: null,
    priority: 'medium',
    startAt: null,
    allDay: false,
    durationMin: null,
    assigneeIds: [],
    checklist: [],
  }
  return { ...createTask(input, 'p1'), ...over }
}

describe('Datum und Uhrzeit', () => {
  it('baut startAt aus Formularwerten', () => {
    expect(buildStartAt('', '10:00')).toEqual({ startAt: null, allDay: false })
    expect(buildStartAt('2026-11-20', '')).toEqual({ startAt: '2026-11-20', allDay: true })
    expect(buildStartAt('2026-11-20', '10:00')).toEqual({ startAt: '2026-11-20T10:00', allDay: false })
  })

  it('liest Datum und Uhrzeit', () => {
    expect(taskDate(task({ startAt: '2026-11-20T10:00' }))).toBe('2026-11-20')
    expect(taskTime(task({ startAt: '2026-11-20T10:00' }))).toBe('10:00')
    expect(taskTime(task({ startAt: '2026-11-20', allDay: true }))).toBeNull()
    expect(taskDate(task())).toBeNull()
  })

  it('erkennt Überfälliges nur bei offenen Aufgaben', () => {
    expect(isOverdue(task({ startAt: '2026-11-18' }), TODAY)).toBe(true)
    expect(isOverdue(task({ startAt: '2026-11-19T08:00' }), TODAY)).toBe(false)
    expect(isOverdue(task({ startAt: '2026-11-18', status: 'done' }), TODAY)).toBe(false)
    expect(isOverdue(task(), TODAY)).toBe(false)
  })

  it('formatiert Dauer', () => {
    expect(formatDuration(30)).toBe('30 Min.')
    expect(formatDuration(60)).toBe('1 Std.')
    expect(formatDuration(90)).toBe('1 Std. 30 Min.')
  })
})

describe('createTask', () => {
  it('setzt Standardwerte', () => {
    const t = task()
    expect(t.status).toBe('open')
    expect(t.recurrenceRule).toBeNull()
    expect(t.createdBy).toBe('p1')
  })
})

describe('Filter', () => {
  const tasks = [
    task({ id: 'inbox', startAt: null }),
    task({ id: 'plan-lena', startAt: '2026-11-20', assigneeIds: ['lena'], roomId: 'bad' }),
    task({ id: 'plan-ich', startAt: '2026-11-21', assigneeIds: ['ich'], roomId: 'kueche' }),
    task({ id: 'done', startAt: '2026-11-18', status: 'done', completedAt: '2026-11-18T12:00:00Z' }),
    task({ id: 'deleted', startAt: '2026-11-20', deleted: true }),
  ]
  const base = { roomId: null, personId: null, mineOnly: false, meId: 'ich' }

  it('trennt Geplant, Inbox und Erledigt', () => {
    expect(filterTasks(tasks, { ...base, view: 'planned' }).map((t) => t.id)).toEqual(['plan-lena', 'plan-ich'])
    expect(filterTasks(tasks, { ...base, view: 'inbox' }).map((t) => t.id)).toEqual(['inbox'])
    expect(filterTasks(tasks, { ...base, view: 'done' }).map((t) => t.id)).toEqual(['done'])
  })

  it('filtert nach Raum, Person und „Meine Aufgaben“', () => {
    expect(filterTasks(tasks, { ...base, view: 'planned', roomId: 'bad' }).map((t) => t.id)).toEqual(['plan-lena'])
    expect(filterTasks(tasks, { ...base, view: 'planned', personId: 'lena' }).map((t) => t.id)).toEqual(['plan-lena'])
    expect(filterTasks(tasks, { ...base, view: 'planned', mineOnly: true }).map((t) => t.id)).toEqual(['plan-ich'])
  })
})

describe('Sortierung und Gruppierung', () => {
  it('sortiert nach Datum, ganztägig zuerst, dann Uhrzeit und Priorität', () => {
    const sorted = sortTasks([
      task({ id: 'b-10', startAt: '2026-11-20T10:00' }),
      task({ id: 'a-allday', startAt: '2026-11-20', allDay: true }),
      task({ id: 'b-08', startAt: '2026-11-20T08:00' }),
      task({ id: 'early', startAt: '2026-11-19', allDay: true, priority: 'low' }),
      task({ id: 'early-high', startAt: '2026-11-19', allDay: true, priority: 'high' }),
    ])
    expect(sorted.map((t) => t.id)).toEqual(['early-high', 'early', 'a-allday', 'b-08', 'b-10'])
  })

  it('gruppiert nach Tag mit Überfällig zuerst', () => {
    const groups = groupByDay(
      sortTasks([
        task({ startAt: '2026-11-17' }),
        task({ startAt: '2026-11-19' }),
        task({ startAt: '2026-11-20' }),
        task({ startAt: '2026-11-20T09:00' }),
      ]),
      TODAY,
    )
    expect(groups.map((g) => [g.label, g.tasks.length])).toEqual([
      ['Überfällig', 1],
      ['Heute', 1],
      ['Morgen', 2],
    ])
  })
})

describe('todayBuckets', () => {
  it('liefert überfällige, heutige und heute erledigte Aufgaben', () => {
    const tasks = [
      task({ id: 'over', startAt: '2026-11-10' }),
      task({ id: 'today', startAt: '2026-11-19T09:00', assigneeIds: ['ich'] }),
      task({ id: 'tomorrow', startAt: '2026-11-20' }),
      task({ id: 'inbox' }),
      task({ id: 'done-old-today', startAt: '2026-11-10', status: 'done', completedAt: '2026-11-19T08:00:00Z' }),
      task({ id: 'done-yesterday', startAt: '2026-11-18', status: 'done', completedAt: '2026-11-18T08:00:00Z' }),
    ]
    const b = todayBuckets(tasks, TODAY, { mineOnly: false, meId: 'ich' }, sameDay)
    expect(b.overdue.map((t) => t.id)).toEqual(['over'])
    expect(b.today.map((t) => t.id)).toEqual(['today'])
    expect(b.doneToday.map((t) => t.id)).toEqual(['done-old-today'])
    expect(b.inboxCount).toBe(1)
    expect(b.tomorrowCount).toBe(1)

    const mine = todayBuckets(tasks, TODAY, { mineOnly: true, meId: 'ich' }, sameDay)
    expect(mine.overdue).toEqual([])
    expect(mine.today.map((t) => t.id)).toEqual(['today'])
  })
})

describe('checklistProgress', () => {
  it('zählt erledigte Punkte', () => {
    expect(
      checklistProgress([
        { id: '1', title: 'a', done: true },
        { id: '2', title: 'b', done: false },
      ]),
    ).toEqual({ done: 1, total: 2 })
  })
})
