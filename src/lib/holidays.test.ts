import { describe, expect, it } from 'vitest'
import { easterSunday, fourthAdvent, holidayOn, holidaysBetween, holidaysOfYear } from './holidays'

describe('easterSunday', () => {
  it('bekannte Ostertermine', () => {
    expect(easterSunday(2024)).toBe('2024-03-31')
    expect(easterSunday(2025)).toBe('2025-04-20')
    expect(easterSunday(2026)).toBe('2026-04-05')
    expect(easterSunday(2027)).toBe('2027-03-28')
    expect(easterSunday(2038)).toBe('2038-04-25')
    expect(easterSunday(2008)).toBe('2008-03-23')
  })
})

describe('holidaysOfYear (Bremen)', () => {
  it('2027: Feiertage, Advent, Heiligabend und Silvester', () => {
    expect(holidaysOfYear(2027)).toEqual([
      { date: '2027-01-01', name: 'Neujahr' },
      { date: '2027-03-26', name: 'Karfreitag' },
      { date: '2027-03-29', name: 'Ostermontag' },
      { date: '2027-05-01', name: 'Tag der Arbeit' },
      { date: '2027-05-06', name: 'Christi Himmelfahrt' },
      { date: '2027-05-17', name: 'Pfingstmontag' },
      { date: '2027-10-03', name: 'Tag der Deutschen Einheit' },
      { date: '2027-10-31', name: 'Reformationstag' },
      { date: '2027-11-28', name: '1. Advent' },
      { date: '2027-12-05', name: '2. Advent' },
      { date: '2027-12-12', name: '3. Advent' },
      { date: '2027-12-19', name: '4. Advent' },
      { date: '2027-12-24', name: 'Heiligabend' },
      { date: '2027-12-25', name: '1. Weihnachtstag' },
      { date: '2027-12-26', name: '2. Weihnachtstag' },
      { date: '2027-12-31', name: 'Silvester' },
    ])
  })

  it('Adventssonntage; fällt Heiligabend auf den 4. Advent, ein gemeinsamer Eintrag', () => {
    expect(fourthAdvent(2026)).toBe('2026-12-20')
    expect(holidayOn('2026-11-29')?.name).toBe('1. Advent')
    expect(fourthAdvent(2023)).toBe('2023-12-24')
    expect(holidayOn('2023-12-24')?.name).toBe('4. Advent · Heiligabend')
    expect(holidayOn('2023-12-03')?.name).toBe('1. Advent')
  })

  it('keine Feiertage anderer Länder', () => {
    const names = holidaysOfYear(2026).map((h) => h.name)
    expect(names).not.toContain('Fronleichnam')
    expect(names).not.toContain('Allerheiligen')
    expect(names).not.toContain('Heilige Drei Könige')
  })
})

describe('holidaysBetween / holidayOn', () => {
  it('über den Jahreswechsel', () => {
    expect(holidaysBetween('2026-12-20', '2027-01-03').map((h) => h.date)).toEqual([
      '2026-12-20',
      '2026-12-24',
      '2026-12-25',
      '2026-12-26',
      '2026-12-31',
      '2027-01-01',
    ])
    expect(holidaysBetween('', '')).toEqual([])
  })

  it('einzelner Tag', () => {
    expect(holidayOn('2026-10-31')?.name).toBe('Reformationstag')
    expect(holidayOn('2026-11-23')).toBeNull()
  })
})
