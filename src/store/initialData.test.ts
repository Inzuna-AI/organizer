import { describe, expect, it } from 'vitest'
import { createInitialData, makeKuerzel } from './initialData'

describe('initialData', () => {
  it('bildet Kürzel', () => {
    expect(makeKuerzel('Lena')).toBe('LE')
    expect(makeKuerzel('Max Mustermann')).toBe('MM')
  })

  it('legt Grundstruktur mit Personen, Räumen und Einkaufsliste an', () => {
    const d = createInitialData(['Lena', ' ', 'Max'])
    expect(d.schemaVersion).toBe(1)
    expect(d.persons.map((p) => p.name)).toEqual(['Lena', 'Max'])
    expect(d.rooms.length).toBeGreaterThan(0)
    expect(d.shoppingLists.map((l) => l.name)).toEqual(['Einkauf'])
    for (const r of [...d.persons, ...d.rooms, ...d.shoppingLists]) {
      expect(r.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(r.deleted).toBe(false)
      expect(r.updatedAt).toBeTruthy()
    }
  })
})
