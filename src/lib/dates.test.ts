import { describe, expect, it } from 'vitest'
import { addDays, berlinDateString, formatDay, formatYmd, weekdayShort } from './dates'

describe('dates', () => {
  it('addiert Tage über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('liefert Wochentag und deutsches Datum', () => {
    expect(weekdayShort('2026-11-19')).toBe('Do')
    expect(weekdayShort('2026-11-23')).toBe('Mo')
    expect(formatYmd('2026-01-05')).toBe('05.01.2026')
  })

  it('formatiert relative Tage', () => {
    const today = '2026-11-19'
    expect(formatDay('2026-11-19', today)).toBe('Heute')
    expect(formatDay('2026-11-20', today)).toBe('Morgen')
    expect(formatDay('2026-11-18', today)).toBe('Gestern')
    expect(formatDay('2026-11-23', today)).toBe('Mo, 23.11.')
    expect(formatDay('2027-01-04', today)).toBe('Mo, 04.01.2027')
  })

  it('bestimmt das Datum in Berlin, nicht in UTC', () => {
    // 23:30 UTC am 19.11. ist in Berlin schon der 20.11.
    expect(berlinDateString(new Date('2026-11-19T23:30:00Z'))).toBe('2026-11-20')
  })
})
