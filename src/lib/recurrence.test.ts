import { describe, expect, it } from 'vitest'
import type { Occurrence, Task } from '@/types/data'
import {
  buildRule,
  datesBetween,
  defaultSpec,
  describeRule,
  doneInstances,
  expandRange,
  instanceAt,
  instanceIndex,
  neighborDates,
  nextAfterCompletion,
  nextOpen,
  occurrenceId,
  overdueInstance,
  parseRule,
  shiftRule,
  shiftedSeriesStart,
} from './recurrence'

function task(partial: Partial<Task>): Task {
  return {
    id: 't1',
    updatedAt: '2026-11-01T00:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    title: 'Test',
    description: '',
    roomId: null,
    priority: 'medium',
    startAt: '2026-11-02',
    allDay: true,
    durationMin: null,
    status: 'open',
    completedAt: null,
    assigneeIds: [],
    recurrenceRule: 'FREQ=DAILY',
    recurrenceMode: 'fixed',
    rotation: false,
    checklist: [],
    ...partial,
  }
}

function occ(date: string, partial: Partial<Occurrence> = {}): Occurrence {
  return {
    id: occurrenceId('t1', date),
    updatedAt: '2026-11-01T00:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    taskId: 't1',
    originalDate: date,
    movedTo: null,
    status: 'open',
    completedAt: null,
    completedBy: null,
    assigneeId: null,
    ...partial,
  }
}

describe('Regel bauen und lesen', () => {
  // 2026-11-20 ist ein Freitag (3. Freitag im November), 2026-11-27 der letzte Freitag
  it('baut die unterstützten Muster', () => {
    expect(buildRule(defaultSpec('daily', '2026-11-20'), '2026-11-20')).toBe('FREQ=DAILY')
    expect(buildRule({ ...defaultSpec('daily', '2026-11-20'), interval: 3 }, '2026-11-20')).toBe('FREQ=DAILY;INTERVAL=3')
    expect(buildRule(defaultSpec('weekdays', '2026-11-20'), '2026-11-20')).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(buildRule(defaultSpec('weekly', '2026-11-20'), '2026-11-20')).toBe('FREQ=WEEKLY;BYDAY=FR')
    expect(buildRule({ ...defaultSpec('weekly', '2026-11-20'), interval: 2, byWeekday: [3, 0] }, '2026-11-20')).toBe(
      'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH',
    )
    expect(buildRule(defaultSpec('monthly', '2026-11-15'), '2026-11-15')).toBe('FREQ=MONTHLY')
    expect(buildRule({ ...defaultSpec('monthly', '2026-11-20'), monthly: 'nth' }, '2026-11-20')).toBe('FREQ=MONTHLY;BYDAY=3FR')
    expect(buildRule({ ...defaultSpec('monthly', '2026-11-27'), monthly: 'last' }, '2026-11-27')).toBe('FREQ=MONTHLY;BYDAY=-1FR')
    expect(buildRule(defaultSpec('yearly', '2026-11-20'), '2026-11-20')).toBe('FREQ=YEARLY')
    expect(buildRule({ ...defaultSpec('daily', '2026-11-20'), until: '2026-12-31' }, '2026-11-20')).toBe(
      'FREQ=DAILY;UNTIL=20261231T235959Z',
    )
  })

  it('after_completion speichert nur Rhythmus und Intervall', () => {
    expect(buildRule({ ...defaultSpec('weekly', '2026-11-20'), interval: 2 }, '2026-11-20', 'after_completion')).toBe(
      'FREQ=WEEKLY;INTERVAL=2',
    )
  })

  it('liest Regeln zurück', () => {
    expect(parseRule('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', '2026-11-20').freq).toBe('weekdays')
    expect(parseRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH', '2026-11-20')).toMatchObject({
      freq: 'weekly',
      interval: 2,
      byWeekday: [0, 3],
    })
    expect(parseRule('FREQ=MONTHLY;BYDAY=-1FR', '2026-11-27').monthly).toBe('last')
    expect(parseRule('FREQ=MONTHLY;BYDAY=3FR', '2026-11-20').monthly).toBe('nth')
    expect(parseRule('FREQ=DAILY;UNTIL=20261231T235959Z', '2026-11-20').until).toBe('2026-12-31')
  })

  it('beschreibt Regeln auf Deutsch', () => {
    expect(describeRule('FREQ=WEEKLY;BYDAY=SA', '2026-11-21')).toBe('Jede Woche am Sa')
    expect(describeRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH', '2026-11-23')).toBe('Alle 2 Wochen am Mo, Do')
    expect(describeRule('FREQ=MONTHLY;BYDAY=-1FR', '2026-11-27')).toBe('Jeden Monat am letzten Freitag')
    expect(describeRule('FREQ=MONTHLY', '2026-11-15')).toBe('Jeden Monat am 15.')
    expect(describeRule('FREQ=DAILY;INTERVAL=3', '2026-11-15', 'after_completion')).toBe('3 Tage nach Erledigung')
    expect(describeRule('FREQ=DAILY;UNTIL=20261231T235959Z', '2026-11-15')).toBe('Täglich bis 31.12.2026')
  })
})

describe('Termine berechnen', () => {
  it('wöchentlich am Samstag, mit Uhrzeit', () => {
    const t = task({ startAt: '2026-11-21T10:00', allDay: false, recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA' })
    const list = expandRange(t, [], '2026-11-16', '2026-12-06')
    expect(list.map((i) => i.startAt)).toEqual(['2026-11-21T10:00', '2026-11-28T10:00', '2026-12-05T10:00'])
  })

  it('werktags ohne Wochenende', () => {
    const t = task({ startAt: '2026-11-20', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' })
    expect(datesBetween(t, '2026-11-20', '2026-11-24')).toEqual(['2026-11-20', '2026-11-23', '2026-11-24'])
  })

  it('monatlich am letzten Freitag', () => {
    const t = task({ startAt: '2026-11-27', recurrenceRule: 'FREQ=MONTHLY;BYDAY=-1FR' })
    expect(datesBetween(t, '2026-11-01', '2027-02-28')).toEqual(['2026-11-27', '2026-12-25', '2027-01-29', '2027-02-26'])
  })

  it('alle 2 Wochen', () => {
    const t = task({ startAt: '2026-11-02', recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO' })
    expect(datesBetween(t, '2026-11-01', '2026-12-01')).toEqual(['2026-11-02', '2026-11-16', '2026-11-30'])
  })

  it('jährlich und bis zu einem Enddatum', () => {
    const t = task({ startAt: '2026-03-15', recurrenceRule: 'FREQ=YEARLY;UNTIL=20281231T235959Z' })
    expect(datesBetween(t, '2026-01-01', '2030-12-31')).toEqual(['2026-03-15', '2027-03-15', '2028-03-15'])
  })

  it('keine Zeitverschiebung über die Sommerzeit', () => {
    const t = task({ startAt: '2026-03-27T09:00', allDay: false, recurrenceRule: 'FREQ=DAILY' })
    expect(expandRange(t, [], '2026-03-28', '2026-03-30').map((i) => i.startAt)).toEqual([
      '2026-03-28T09:00',
      '2026-03-29T09:00',
      '2026-03-30T09:00',
    ])
  })

  it('übersprungene fehlen, verschobene erscheinen am neuen Tag', () => {
    const t = task({ startAt: '2026-11-21T10:00', allDay: false, recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA' })
    const occs = [occ('2026-11-21', { status: 'skipped' }), occ('2026-11-28', { movedTo: '2026-12-08T18:00' })]
    expect(expandRange(t, occs, '2026-11-16', '2026-11-30')).toEqual([])
    const dec = expandRange(t, occs, '2026-12-01', '2026-12-13')
    expect(dec.map((i) => [i.date, i.startAt, i.moved])).toEqual([
      ['2026-12-05', '2026-12-05T10:00', false],
      ['2026-11-28', '2026-12-08T18:00', true],
      ['2026-12-12', '2026-12-12T10:00', false],
    ])
  })

  it('instanceAt findet echte und verschobene Termine, sonst null', () => {
    const t = task({ startAt: '2026-11-21', recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA' })
    expect(instanceAt(t, [], '2026-11-28')?.status).toBe('open')
    expect(instanceAt(t, [], '2026-11-27')).toBeNull()
    expect(instanceAt(t, [occ('2026-11-28', { status: 'done', completedAt: 'x' })], '2026-11-28')?.status).toBe('done')
  })
})

describe('Heute, Geplant, Überfällig', () => {
  const t = task({ startAt: '2026-11-02', recurrenceRule: 'FREQ=DAILY' })

  it('nur der letzte verpasste Termin ist überfällig', () => {
    expect(overdueInstance(t, [], '2026-11-19')?.date).toBe('2026-11-18')
    expect(overdueInstance(t, [occ('2026-11-18', { status: 'done' })], '2026-11-19')).toBeNull()
    expect(overdueInstance(t, [occ('2026-11-18', { status: 'skipped' })], '2026-11-19')).toBeNull()
  })

  it('nicht überfällig vor dem Serienstart', () => {
    expect(overdueInstance(task({ startAt: '2026-11-25' }), [], '2026-11-19')).toBeNull()
  })

  it('nächster offener Termin überspringt erledigte', () => {
    expect(nextOpen(t, [], '2026-11-19')?.date).toBe('2026-11-19')
    expect(nextOpen(t, [occ('2026-11-19', { status: 'done' })], '2026-11-19')?.date).toBe('2026-11-20')
  })

  it('Serie mit Ende hat danach keinen Termin', () => {
    const ended = task({ recurrenceRule: 'FREQ=DAILY;UNTIL=20261110T235959Z' })
    expect(nextOpen(ended, [], '2026-11-19')).toBeNull()
  })

  it('erledigte Termine', () => {
    const list = doneInstances(t, [occ('2026-11-05', { status: 'done', completedAt: 'a' }), occ('2026-11-06')])
    expect(list.map((i) => i.date)).toEqual(['2026-11-05'])
  })
})

describe('Rotation', () => {
  it('fester Rhythmus: abwechselnd nach Position in der Serie', () => {
    const t = task({ startAt: '2026-11-21', recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA', rotation: true, assigneeIds: ['a', 'b'] })
    const list = expandRange(t, [], '2026-11-21', '2026-12-12')
    expect(list.map((i) => i.assigneeIds[0])).toEqual(['a', 'b', 'a', 'b'])
    // Ein späterer Zeitraum rechnet mit derselben Position weiter
    expect(expandRange(t, [], '2026-12-05', '2026-12-05')[0].assigneeIds).toEqual(['a'])
    expect(instanceIndex(t, '2026-12-12')).toBe(3)
  })

  it('eigene Zuweisung eines Termins hat Vorrang', () => {
    const t = task({ startAt: '2026-11-21', recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA', rotation: true, assigneeIds: ['a', 'b'] })
    expect(instanceAt(t, [occ('2026-11-21', { assigneeId: 'b' })], '2026-11-21')?.assigneeIds).toEqual(['b'])
  })

  it('ohne Rotation sind alle zuständig', () => {
    const t = task({ assigneeIds: ['a', 'b'] })
    expect(instanceAt(t, [], '2026-11-03')?.assigneeIds).toEqual(['a', 'b'])
  })

  it('after_completion: nach Anzahl erledigter Termine', () => {
    const t = task({
      startAt: '2026-11-20',
      recurrenceRule: 'FREQ=DAILY;INTERVAL=3',
      recurrenceMode: 'after_completion',
      rotation: true,
      assigneeIds: ['a', 'b'],
    })
    expect(nextOpen(t, [], '2026-11-19')?.assigneeIds).toEqual(['a'])
    expect(nextOpen(t, [occ('2026-11-17', { status: 'done', assigneeId: 'a' })], '2026-11-19')?.assigneeIds).toEqual(['b'])
  })
})

describe('after_completion', () => {
  it('nächster Termin = Erledigung + Intervall, Uhrzeit bleibt', () => {
    const t = task({ startAt: '2026-11-20T18:00', allDay: false, recurrenceRule: 'FREQ=DAILY;INTERVAL=3', recurrenceMode: 'after_completion' })
    expect(nextAfterCompletion(t, '2026-11-22')).toBe('2026-11-25T18:00')
    expect(nextAfterCompletion({ ...t, recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2' }, '2026-11-22')).toBe('2026-12-06T18:00')
    expect(nextAfterCompletion({ ...t, recurrenceRule: 'FREQ=MONTHLY' }, '2026-01-31')).toBe('2026-02-28T18:00')
  })

  it('überfällig, wenn der aktuelle Termin in der Vergangenheit liegt', () => {
    const t = task({ startAt: '2026-11-17', recurrenceRule: 'FREQ=DAILY;INTERVAL=3', recurrenceMode: 'after_completion' })
    expect(overdueInstance(t, [], '2026-11-19')?.date).toBe('2026-11-17')
    expect(overdueInstance(t, [], '2026-11-17')).toBeNull()
  })
})

describe('Serie verschieben', () => {
  it('Wochentage wandern mit', () => {
    expect(shiftRule('FREQ=WEEKLY;BYDAY=SA', '2026-11-21', '2026-11-22')).toBe('FREQ=WEEKLY;BYDAY=SU')
    expect(shiftRule('FREQ=WEEKLY;BYDAY=MO,TH', '2026-11-23', '2026-11-24')).toBe('FREQ=WEEKLY;BYDAY=TU,FR')
    expect(shiftRule('FREQ=DAILY', '2026-11-23', '2026-11-24')).toBe('FREQ=DAILY')
  })

  it('monatlich am n-ten Wochentag wird neu berechnet', () => {
    expect(shiftRule('FREQ=MONTHLY;BYDAY=3FR', '2026-11-20', '2026-11-12')).toBe('FREQ=MONTHLY;BYDAY=2TH')
  })

  it('neuer Serienstart um denselben Abstand', () => {
    expect(shiftedSeriesStart('2026-11-07T10:00', '2026-11-21', '2026-11-22T12:30')).toBe('2026-11-08T12:30')
    expect(shiftedSeriesStart('2026-11-07T10:00', '2026-11-21', '2026-11-21')).toBe('2026-11-07')
  })
})

describe('Blättern zwischen Terminen', () => {
  it('fester Rhythmus: vorheriger und nächster Termin, ausgelassene übersprungen', () => {
    const t = task({ startAt: '2026-11-07T10:00', allDay: false, recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA' })
    expect(neighborDates(t, [], '2026-11-21')).toEqual({ prev: '2026-11-14', next: '2026-11-28' })
    expect(neighborDates(t, [occ('2026-11-14', { status: 'skipped' })], '2026-11-21')).toEqual({
      prev: '2026-11-07',
      next: '2026-11-28',
    })
    expect(neighborDates(t, [], '2026-11-07').prev).toBeNull()
  })

  it('Zeitraum-Serie (monatlich)', () => {
    const t = task({ startAt: '2026-10-01', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1' })
    expect(neighborDates(t, [], '2026-11-01')).toEqual({ prev: '2026-10-01', next: '2026-12-01' })
  })

  it('after_completion: erledigte Termine und der aktuelle', () => {
    const t = task({ startAt: '2026-11-25', recurrenceRule: 'FREQ=DAILY;INTERVAL=3', recurrenceMode: 'after_completion' })
    const occs = [occ('2026-11-16', { status: 'done' }), occ('2026-11-22', { status: 'done' })]
    expect(neighborDates(t, occs, '2026-11-25')).toEqual({ prev: '2026-11-22', next: null })
    expect(neighborDates(t, occs, '2026-11-22')).toEqual({ prev: '2026-11-16', next: '2026-11-25' })
  })
})
