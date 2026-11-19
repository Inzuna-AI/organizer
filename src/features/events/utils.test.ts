import { describe, expect, it } from 'vitest'
import type { CalEvent, Person } from '@/types/data'
import { eventsBetween } from '@/lib/events'
import { defaultFormValues, eventBackground, fromFormValues, moveStart, personsLabel, timeLabel, toFormValues } from './utils'

const base = { updatedAt: '2026-11-19T10:00:00Z', deleted: false, createdBy: null, updatedBy: null }
const p = (id: string, name: string, color: string): Person => ({ ...base, id, name, kuerzel: name.slice(0, 2), color })
const persons = [p('c', 'Christoph', '#2563eb'), p('l', 'Lena', '#db2777'), p('e', 'Erina', '#16a34a')]

function ev(o: Partial<CalEvent>): CalEvent {
  return {
    ...base,
    id: 'x',
    title: 'Termin',
    location: '',
    note: '',
    startAt: '2026-11-20T10:00',
    endAt: '2026-11-20T11:30',
    allDay: false,
    personIds: [],
    recurrenceRule: null,
    exceptions: [],
    ...o,
  }
}

describe('Formularwerte', () => {
  it('neuer Termin: mit Uhrzeit 1 Stunde, ohne Uhrzeit ganztägig', () => {
    expect(fromFormValues(defaultFormValues('2026-11-20', '23:30'))).toEqual({
      startAt: '2026-11-20T23:30',
      endAt: '2026-11-21T00:30',
      allDay: false,
    })
    // Ohne Uhrzeit: nicht ganztägig, sondern 10 Uhr mit Standarddauer
    expect(fromFormValues(defaultFormValues('2026-11-20', ''))).toEqual({
      startAt: '2026-11-20T10:00',
      endAt: '2026-11-20T11:00',
      allDay: false,
    })
  })

  it('Beginn verschieben nimmt das Ende mit', () => {
    const v = toFormValues({ startAt: '2026-11-20T10:00', endAt: '2026-11-20T11:30', allDay: false })
    expect(fromFormValues(moveStart(v, '2026-11-22', '18:00'))).toEqual({
      startAt: '2026-11-22T18:00',
      endAt: '2026-11-22T19:30',
      allDay: false,
    })
    const d = toFormValues({ startAt: '2026-11-20', endAt: '2026-11-22', allDay: true })
    expect(fromFormValues(moveStart(d, '2026-12-01', ''))).toEqual({ startAt: '2026-12-01', endAt: '2026-12-03', allDay: true })
  })

  it('Ende vor Beginn ist ungültig', () => {
    const v = { startDate: '2026-11-20', startTime: '10:00', endDate: '2026-11-20', endTime: '09:00', allDay: false }
    expect(fromFormValues(v)).toBeNull()
  })
})

describe('Anzeige', () => {
  it('Personen: alle oder keine = Familie, sonst Namen', () => {
    expect(personsLabel(['c', 'l', 'e'], persons)).toBe('Familie')
    expect(personsLabel([], persons)).toBe('Familie')
    expect(personsLabel(['l', 'e'], persons)).toBe('Lena, Erina')
  })

  it('Streifen bei mehreren Personen', () => {
    expect(eventBackground(['#111111'])).toBe('#111111')
    expect(eventBackground(['#111111', '#222222'])).toMatch(/^repeating-linear-gradient\(135deg, #111111 0px 8px, #222222 8px 16px\)$/)
  })

  it('Zeitangabe, auch für mehrtägige Termine', () => {
    const [i] = eventsBetween([ev({})], '2026-11-20', '2026-11-20')
    expect(timeLabel(i)).toBe('10:00–11:30')
    const [m] = eventsBetween([ev({ startAt: '2026-11-20T18:00', endAt: '2026-11-22T12:00' })], '2026-11-21', '2026-11-21')
    expect(timeLabel(m, '2026-11-21')).toBe('ganztägig')
    expect(timeLabel(m, '2026-11-22')).toBe('bis 12:00')
    const [a] = eventsBetween([ev({ startAt: '2026-11-20', endAt: null, allDay: true })], '2026-11-20', '2026-11-20')
    expect(timeLabel(a)).toBe('ganztägig')
  })
})
