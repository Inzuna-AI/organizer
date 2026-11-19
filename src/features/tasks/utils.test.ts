import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/data'
import {
  buildStartAt,
  checklistProgress,
  createTask,
  filterTasks,
  formatDuration,
  groupByDay,
  groupByPeriod,
  isOverdue,
  periodChoices,
  sortTasks,
  taskDate,
  taskTime,
  todayBuckets,
  listInstances,
  upsertOccurrence,
  type TaskInput,
} from './utils'
import { occurrenceId } from '@/lib/recurrence'

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
    recurrenceRule: null,
    recurrenceMode: 'fixed',
    rotation: false,
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

describe('Serien in Listen', () => {
  it('zeigt überfälligen, heutigen, morgigen und erledigte Termine einer täglichen Serie', () => {
    const t = task({ startAt: '2026-11-10', allDay: true, recurrenceRule: 'FREQ=DAILY' })
    const done = {
      id: occurrenceId(t.id, '2026-11-12'),
      updatedAt: 'x',
      deleted: false,
      createdBy: null,
      updatedBy: null,
      taskId: t.id,
      originalDate: '2026-11-12',
      movedTo: null,
      status: 'done' as const,
      completedAt: '2026-11-12T10:00:00.000Z',
      completedBy: 'p1',
      assigneeId: null,
    }
    const list = listInstances([t], [done], TODAY)
    expect(list.map((i) => [i.occurrenceDate, i.status]).sort()).toEqual([
      ['2026-11-12', 'done'],
      ['2026-11-18', 'open'],
      ['2026-11-19', 'open'],
      ['2026-11-20', 'open'],
    ])
    const b = todayBuckets(list, TODAY, { mineOnly: false, meId: null }, sameDay)
    expect(b.overdue.map((i) => i.occurrenceDate)).toEqual(['2026-11-18'])
    expect(b.today.map((i) => i.occurrenceDate)).toEqual(['2026-11-19'])
    expect(b.tomorrowCount).toBe(1)
  })

  it('wöchentliche Serie zeigt nur den nächsten Termin', () => {
    const t = task({ startAt: '2026-11-21T10:00', recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA' })
    expect(listInstances([t], [], TODAY).map((i) => i.startAt)).toEqual(['2026-11-21T10:00'])
  })

  it('createTask ohne Datum ist nie eine Serie', () => {
    expect(task({}).recurrenceRule).toBeNull()
  })

  it('upsertOccurrence legt an und ändert denselben Datensatz', () => {
    let occs = upsertOccurrence([], 't', '2026-11-21', 'p1', { status: 'done' })
    occs = upsertOccurrence(occs, 't', '2026-11-21', 'p2', { status: 'open' })
    expect(occs).toHaveLength(1)
    expect(occs[0]).toMatchObject({ id: 't:2026-11-21', status: 'open', updatedBy: 'p2' })
  })
})

describe('Aufgaben mit Zeitraum', () => {
  // 19.11.2026 = Donnerstag, Woche 16.–22.11.
  const week = task({ title: 'Fenster', startAt: '2026-11-16', allDay: true, period: 'week' })
  const month = task({ title: 'Keller', startAt: '2026-11-01', allDay: true, period: 'month' })
  const nextMonth = task({ title: 'Garage', startAt: '2026-12-01', allDay: true, period: 'month' })
  const past = task({ title: 'Altpapier', startAt: '2026-11-09', allDay: true, period: 'week' })
  const series = task({
    title: 'Bad',
    startAt: '2026-11-02',
    allDay: true,
    period: 'week',
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
  })
  const fixed = task({ title: 'Müll', startAt: '2026-11-19' })
  const all = listInstances([week, month, nextMonth, past, series, fixed], [], TODAY)

  it('eigene Ansicht, nicht unter Geplant', () => {
    const f = { roomId: null, personId: null, mineOnly: false, meId: null }
    expect(filterTasks(all, { ...f, view: 'planned' }).map((t) => t.title)).toEqual(['Müll'])
    expect(filterTasks(all, { ...f, view: 'period' }).map((t) => t.title).sort()).toEqual(
      ['Altpapier', 'Bad', 'Fenster', 'Garage', 'Keller'],
    )
  })

  it('überfällig erst nach Ende des Zeitraums, Serien verfallen still', () => {
    expect(isOverdue(week, TODAY)).toBe(false)
    expect(isOverdue(week, '2026-11-23')).toBe(true)
    expect(isOverdue(past, TODAY)).toBe(true)
    // Serie: nur der laufende Zeitraum, nichts überfällig
    expect(all.filter((t) => t.title === 'Bad').map((t) => t.occurrenceDate)).toEqual(['2026-11-16'])
  })

  it('Gruppen: überfällig, laufend, kommend', () => {
    const groups = groupByPeriod(all.filter((t) => t.period), TODAY)
    expect(groups.map((g) => [g.label, g.tasks.map((t) => t.title).sort()])).toEqual([
      ['Überfällig', ['Altpapier']],
      ['Diese Woche', ['Bad', 'Fenster']],
      ['November', ['Keller']],
      ['Dezember · ab Di, 01.12.', ['Garage']],
    ])
  })

  it('Heute: eigener Abschnitt, nicht bei „heute“ oder „morgen“', () => {
    const b = todayBuckets(all, TODAY, { mineOnly: false, meId: null }, sameDay)
    expect(b.today.map((t) => t.title)).toEqual(['Müll'])
    expect(b.period.map((t) => t.title)).toEqual(['Bad', 'Fenster', 'Keller'])
    expect(b.overdue.map((t) => t.title)).toEqual(['Altpapier'])
    // Am Montag der Woche erscheint die Aufgabe nicht unter „Aufgaben heute“
    const monday = todayBuckets(all, '2026-11-16', { mineOnly: false, meId: null }, sameDay)
    expect(monday.today.map((t) => t.title)).toEqual([])
  })

  it('Auswahl im Formular', () => {
    expect(periodChoices('week', TODAY, 3).map((c) => c.label)).toEqual([
      'Diese Woche (16.11.–22.11.)',
      'Nächste Woche (23.11.–29.11.)',
      '30.11.–06.12.',
    ])
    expect(periodChoices('month', TODAY, 3).map((c) => [c.from, c.label])).toEqual([
      ['2026-11-01', 'November'],
      ['2026-12-01', 'Dezember'],
      ['2027-01-01', 'Januar 2027'],
    ])
  })

  it('ohne Datum kein Zeitraum', () => {
    expect(createTask({ ...week, startAt: null, period: 'week' }, null).period).toBeNull()
  })
})
