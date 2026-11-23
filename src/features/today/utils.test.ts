import { describe, expect, it } from 'vitest'
import { DEFAULT_ORDER, moveSection, normalizeOrder } from './utils'

describe('Reihenfolge der Abschnitte', () => {
  it('ohne Speicherstand: Standard', () => {
    expect(normalizeOrder(null)).toEqual(DEFAULT_ORDER)
    expect(normalizeOrder('kaputt')).toEqual(DEFAULT_ORDER)
  })

  it('übernimmt gespeicherte Reihenfolge, entfernt Unbekanntes und Doppeltes', () => {
    const saved = ['done', 'today', 'x', 'today', 'events', 'overdue', 'period', 'links']
    expect(normalizeOrder(saved)).toEqual(['done', 'today', 'events', 'meal', 'overdue', 'period', 'links'])
  })

  it('fehlende Abschnitte kommen hinter ihren Standard-Vorgänger', () => {
    expect(normalizeOrder(['done', 'today', 'events'])).toEqual(['done', 'today', 'period', 'links', 'events', 'meal', 'overdue'])
  })

  it('verschieben', () => {
    expect(moveSection(['events', 'overdue', 'today'] as never, 2, -1)).toEqual(['events', 'today', 'overdue'])
    const o = DEFAULT_ORDER
    expect(moveSection(o, 0, -1)).toBe(o)
    expect(moveSection(o, o.length - 1, 1)).toBe(o)
  })
})
