import { describe, expect, it } from 'vitest'
import type { CalEvent, Person } from '@/types/data'
import {
  dayRange,
  eventInstanceAt,
  eventInstances,
  eventsBetween,
  eventSpan,
  involves,
  isFamily,
  movedTimes,
  shiftSeries,
  withException,
} from './events'

function ev(p: Partial<CalEvent>): CalEvent {
  return {
    id: 'e1',
    updatedAt: '2026-11-01T00:00:00Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    title: 'Termin',
    location: '',
    note: '',
    startAt: '2026-11-20T10:00',
    endAt: null,
    allDay: false,
    personIds: [],
    recurrenceRule: null,
    exceptions: [],
    ...p,
  }
}

describe('Termine: Dauer und Tage', () => {
  it('ohne Ende: 60 Minuten bzw. ein Tag', () => {
    expect(eventSpan(ev({}))).toBe(60)
    expect(eventSpan(ev({ startAt: '2026-11-20', allDay: true }))).toBe(0)
  })

  it('mehrtägig ganztägig: alle Tage im Zeitraum', () => {
    const e = ev({ startAt: '2026-11-20', endAt: '2026-11-23', allDay: true })
    expect(eventInstances(e, '2026-11-22', '2026-11-22')).toHaveLength(1)
    expect(eventInstances(e, '2026-11-24', '2026-11-30')).toHaveLength(0)
  })

  it('über Mitternacht, Ende 0:00 zählt zum Vortag', () => {
    expect(dayRange({ startAt: '2026-11-20T20:00', endAt: '2026-11-21T02:00', allDay: false })).toEqual(['2026-11-20', '2026-11-21'])
    expect(dayRange({ startAt: '2026-11-20T20:00', endAt: '2026-11-21T00:00', allDay: false })).toEqual(['2026-11-20', '2026-11-20'])
  })
})

describe('Termin-Serien', () => {
  const weekly = ev({ startAt: '2026-11-20T18:00', endAt: '2026-11-20T19:30', recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR' })

  it('löst wöchentliche Termine mit Dauer auf', () => {
    const list = eventInstances(weekly, '2026-11-16', '2026-12-06')
    expect(list.map((i) => i.startAt)).toEqual(['2026-11-20T18:00', '2026-11-27T18:00', '2026-12-04T18:00'])
    expect(list[1].endAt).toBe('2026-11-27T19:30')
  })

  it('Ausnahmen: verschoben und ausgefallen', () => {
    let e = { ...weekly, exceptions: withException(weekly, '2026-11-27', { movedTo: '2026-11-28T10:00' }) }
    e = { ...e, exceptions: withException(e, '2026-12-04', { skipped: true }) }
    const list = eventInstances(e, '2026-11-16', '2026-12-06')
    expect(list.map((i) => i.startAt)).toEqual(['2026-11-20T18:00', '2026-11-28T10:00'])
    expect(list[1].moved).toBe(true)
    expect(eventInstanceAt(e, '2026-11-27')?.endAt).toBe('2026-11-28T11:30')
  })

  it('zurück auf die ursprüngliche Zeit entfernt die Ausnahme', () => {
    const e = { ...weekly, exceptions: withException(weekly, '2026-11-27', { movedTo: '2026-11-28T10:00' }) }
    expect(withException(e, '2026-11-27', { movedTo: '2026-11-27T18:00' })).toEqual([])
  })

  it('jährlicher Geburtstag, auch im Folgejahr', () => {
    const bday = ev({ startAt: '2026-03-14', allDay: true, recurrenceRule: 'FREQ=YEARLY' })
    expect(eventsBetween([bday], '2027-03-01', '2027-03-31').map((i) => i.startAt)).toEqual(['2027-03-14'])
  })

  it('mehrtägige Serie beginnt vor dem Zeitraum', () => {
    const e = ev({ startAt: '2026-11-20', endAt: '2026-11-22', allDay: true, recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR' })
    expect(eventInstances(e, '2026-11-22', '2026-11-22').map((i) => i.startAt)).toEqual(['2026-11-20'])
  })

  it('ganze Serie verschieben: Ende und Wochentag wandern mit', () => {
    const s = shiftSeries(weekly, '2026-11-27', '2026-11-28T17:00')
    expect(s.startAt).toBe('2026-11-21T17:00')
    expect(s.endAt).toBe('2026-11-21T18:30')
    expect(s.recurrenceRule).toContain('BYDAY=SA')
  })
})

describe('Personen', () => {
  const p = (id: string, deleted = false) => ({ id, deleted }) as Person
  it('Familie = alle lebenden Personen', () => {
    const persons = [p('c'), p('l'), p('e'), p('x', true)]
    expect(isFamily(['c', 'l', 'e'], persons)).toBe(true)
    expect(isFamily(['c', 'l'], persons)).toBe(false)
  })
  it('ohne Personen betrifft der Termin alle', () => {
    expect(involves({ personIds: [] }, 'c')).toBe(true)
    expect(involves({ personIds: ['l'] }, 'c')).toBe(false)
  })
})


describe('Termine verschieben', () => {
  it('einmaliger Termin: Länge bleibt, Wechsel auf ganztägig verwirft die Uhrzeit-Länge', () => {
    const e = ev({ startAt: '2026-11-20T10:00', endAt: '2026-11-20T11:30' })
    expect(movedTimes(e, '2026-11-21T14:00')).toEqual({ startAt: '2026-11-21T14:00', endAt: '2026-11-21T15:30', allDay: false })
    expect(movedTimes(e, '2026-11-21')).toEqual({ startAt: '2026-11-21', endAt: null, allDay: true })
    expect(movedTimes(e, '2026-11-21T14:00', '2026-11-21T14:45').endAt).toBe('2026-11-21T14:45')
  })

  it('mehrtägig ganztägig bleibt mehrtägig', () => {
    const e = ev({ startAt: '2026-11-20', endAt: '2026-11-22', allDay: true })
    expect(movedTimes(e, '2026-11-27')).toEqual({ startAt: '2026-11-27', endAt: '2026-11-29', allDay: true })
  })

  it('Serie mit neuer Länge verschieben', () => {
    const e = ev({ startAt: '2026-11-16T10:00', endAt: '2026-11-16T11:00', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO' })
    const s = shiftSeries(e, '2026-11-23', '2026-11-24T12:00', '2026-11-24T14:00')
    expect(s).toMatchObject({ startAt: '2026-11-17T12:00', endAt: '2026-11-17T14:00', allDay: false })
    expect(s.recurrenceRule).toContain('BYDAY=TU')
  })

  it('Serie von Uhrzeit auf ganztägig: keine Minuten als Tage', () => {
    const e = ev({ startAt: '2026-11-16T10:00', endAt: '2026-11-16T11:00', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO' })
    expect(shiftSeries(e, '2026-11-23', '2026-11-23')).toMatchObject({ startAt: '2026-11-16', endAt: null, allDay: true })
  })
})