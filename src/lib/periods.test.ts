import { describe, expect, it } from 'vitest'
import type { Occurrence, Task } from '@/types/data'
import {
  currentPeriod,
  describePeriodRepeat,
  openPeriod,
  periodInstances,
  periodLabel,
  periodRange,
  periodRule,
  periodStartOf,
  untilLabel,
} from './periods'
import { buildRule, defaultSpec } from './recurrence'

// 2026-11-19 ist ein Donnerstag
const TODAY = '2026-11-19'

const base = { updatedAt: '2026-11-01T00:00:00Z', deleted: false, createdBy: null, updatedBy: null }

function task(o: Partial<Task>): Task {
  return {
    ...base,
    id: 't',
    title: 'Fenster putzen',
    description: '',
    roomId: null,
    priority: 'medium',
    startAt: '2026-11-16',
    allDay: true,
    durationMin: null,
    status: 'open',
    completedAt: null,
    assigneeIds: [],
    recurrenceRule: null,
    recurrenceMode: 'fixed',
    rotation: false,
    checklist: [],
    period: 'week',
    ...o,
  }
}

function occ(date: string, status: Occurrence['status']): Occurrence {
  return {
    ...base,
    id: `t:${date}`,
    taskId: 't',
    originalDate: date,
    movedTo: null,
    status,
    completedAt: status === 'done' ? '2026-11-18T10:00:00Z' : null,
    completedBy: null,
    assigneeId: null,
  }
}

describe('Zeiträume', () => {
  it('Beginn und Ende', () => {
    expect(periodStartOf(TODAY, 'week')).toBe('2026-11-16')
    expect(periodStartOf('2026-11-22', 'week')).toBe('2026-11-16')
    expect(periodStartOf(TODAY, 'month')).toBe('2026-11-01')
    expect(periodRange(task({}), '2026-11-16')).toEqual({ from: '2026-11-16', to: '2026-11-22' })
    expect(periodRange(task({ recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO' }), '2026-11-16').to).toBe('2026-11-29')
    expect(periodRange(task({ period: 'month' }), '2026-12-01')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
    expect(periodRange(task({ period: 'month', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3' }), '2026-11-01').to).toBe('2027-01-31')
  })

  it('Quartal, Halbjahr, Jahr am Kalender ausgerichtet', () => {
    expect(periodStartOf(TODAY, 'quarter')).toBe('2026-10-01')
    expect(periodStartOf('2026-03-31', 'quarter')).toBe('2026-01-01')
    expect(periodStartOf(TODAY, 'half')).toBe('2026-07-01')
    expect(periodStartOf('2026-06-30', 'half')).toBe('2026-01-01')
    expect(periodStartOf(TODAY, 'year')).toBe('2026-01-01')
    expect(periodRange(task({ period: 'quarter' }), '2026-10-01')).toEqual({ from: '2026-10-01', to: '2026-12-31' })
    expect(periodRange(task({ period: 'half' }), '2027-01-01').to).toBe('2027-06-30')
    expect(periodRange(task({ period: 'year' }), '2027-01-01').to).toBe('2027-12-31')
    // Jedes 2. Quartal: 6 Monate Zeit
    const q2 = task({ period: 'quarter', startAt: '2026-10-01', recurrenceRule: periodRule('quarter', 2) })
    expect(periodRange(q2, '2026-10-01').to).toBe('2027-03-31')
    expect(periodLabel({ from: '2026-10-01', to: '2026-12-31' }, 'quarter', TODAY)).toBe('4. Quartal')
    expect(periodLabel({ from: '2027-01-01', to: '2027-03-31' }, 'quarter', TODAY)).toBe('1. Quartal 2027')
    expect(periodLabel({ from: '2027-07-01', to: '2027-12-31' }, 'half', TODAY)).toBe('2. Halbjahr 2027')
    expect(periodLabel({ from: '2027-01-01', to: '2027-12-31' }, 'year', TODAY)).toBe('2027')
  })

  it('Serie jedes Quartal: laufendes Quartal, danach das nächste', () => {
    const t = task({ period: 'quarter', startAt: '2026-04-01', recurrenceRule: periodRule('quarter', 1) })
    expect(currentPeriod(t, [], TODAY)?.date).toBe('2026-10-01')
    expect(openPeriod(t, [occ('2026-10-01', 'done')], TODAY)?.date).toBe('2027-01-01')
    const y = task({ period: 'year', startAt: '2025-01-01', recurrenceRule: periodRule('year', 1) })
    expect(currentPeriod(y, [], TODAY)?.date).toBe('2026-01-01')
  })

  it('Regel wie buildRule', () => {
    expect(periodRule('week', 1)).toBe(buildRule(defaultSpec('weekly', '2026-11-16'), '2026-11-16'))
    expect(periodRule('week', 2)).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO')
    expect(periodRule('month', 1)).toBe('FREQ=MONTHLY')
    expect(periodRule('year', 1)).toBe('FREQ=MONTHLY;INTERVAL=12')
    expect(periodRule('quarter', 2)).toBe('FREQ=MONTHLY;INTERVAL=6')
    expect(describePeriodRepeat('year', 1)).toBe('Jedes Jahr')
    expect(describePeriodRepeat('quarter', 1)).toBe('Jedes Quartal')
    expect(describePeriodRepeat('half', 2)).toBe('Alle 2 Halbjahre')
    expect(describePeriodRepeat('week', null)).toBe('Einmalig')
  })

  it('Namen', () => {
    expect(periodLabel({ from: '2026-11-16', to: '2026-11-22' }, 'week', TODAY)).toBe('Diese Woche')
    expect(periodLabel({ from: '2026-11-23', to: '2026-11-29' }, 'week', TODAY)).toBe('Nächste Woche')
    expect(periodLabel({ from: '2026-11-30', to: '2026-12-06' }, 'week', TODAY)).toBe('30.11.–06.12.')
    expect(periodLabel({ from: '2026-11-16', to: '2026-11-29' }, 'week', TODAY)).toBe('16.11.–29.11.')
    expect(periodLabel({ from: '2026-12-01', to: '2026-12-31' }, 'month', TODAY)).toBe('Dezember')
    expect(periodLabel({ from: '2026-12-01', to: '2027-01-31' }, 'month', TODAY)).toBe('Dezember–Januar 2027')
    expect(untilLabel('2026-11-22', TODAY)).toBe('bis So, 22.11.')
    expect(untilLabel(TODAY, TODAY)).toBe('bis heute')
  })

  it('Serie: laufender Zeitraum, nach Erledigen der nächste, Verpasstes verfällt', () => {
    const t = task({ startAt: '2026-11-02', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO' })
    // Woche vom 09.11. wurde nicht erledigt: verfällt still
    expect(periodInstances(t, [], TODAY).map((i) => i.date)).toEqual(['2026-11-16'])
    expect(currentPeriod(t, [], TODAY)?.status).toBe('open')

    const done = [occ('2026-11-16', 'done')]
    const list = periodInstances(t, done, TODAY)
    expect(list.map((i) => [i.date, i.status])).toEqual([
      ['2026-11-16', 'done'],
      ['2026-11-23', 'open'],
    ])
    expect(openPeriod(t, done, TODAY)?.date).toBe('2026-11-23')

    // Ausgelassen: nächster Zeitraum erscheint
    expect(periodInstances(t, [occ('2026-11-16', 'skipped')], TODAY).map((i) => i.date)).toEqual(['2026-11-23'])
  })

  it('Serie alle 2 Wochen und monatlich', () => {
    const two = task({ startAt: '2026-11-09', recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO' })
    // 09.11.–22.11. läuft noch
    expect(currentPeriod(two, [], TODAY)?.date).toBe('2026-11-09')
    const monthly = task({ period: 'month', startAt: '2026-10-01', recurrenceRule: 'FREQ=MONTHLY' })
    expect(currentPeriod(monthly, [], TODAY)?.date).toBe('2026-11-01')
    expect(currentPeriod(monthly, [], '2026-12-31')?.date).toBe('2026-12-01')
  })

  it('Serie beginnt später', () => {
    const t = task({ period: 'month', startAt: '2027-01-01', recurrenceRule: 'FREQ=MONTHLY' })
    expect(currentPeriod(t, [], TODAY)).toBeNull()
    expect(periodInstances(t, [], TODAY).map((i) => i.date)).toEqual(['2027-01-01'])
  })

  it('Rotation pro Zeitraum', () => {
    const t = task({
      startAt: '2026-11-02',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
      rotation: true,
      assigneeIds: ['a', 'b'],
    })
    // 02.11. = a, 09.11. = b, 16.11. = a
    expect(currentPeriod(t, [], TODAY)?.assigneeIds).toEqual(['a'])
    expect(openPeriod(t, [occ('2026-11-16', 'done')], TODAY)?.assigneeIds).toEqual(['b'])
  })
})
