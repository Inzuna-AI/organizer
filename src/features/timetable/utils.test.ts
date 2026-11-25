import { describe, expect, it } from 'vitest'
import type { TimetableCell } from '@/types/data'
import { setCell } from './store'
import { cellId, cellText, cellTexts, defaultDay, defaultText, HEADER_ROW, ROWS } from './utils'

describe('Stundenplan', () => {
  it('9 Zeilen ab 8 Uhr, voreingestellte Uhrzeiten und Spaltenköpfe', () => {
    expect(ROWS).toHaveLength(9)
    expect(defaultText(0, 'time')).toBe('08:00')
    expect(defaultText(8, 'time')).toBe('16:00')
    expect(defaultText(HEADER_ROW, 'a')).toBe('Lena')
    expect(defaultText(HEADER_ROW, 'b')).toBe('Christoph')
    expect(defaultText(3, 'a')).toBe('')
  })

  it('Wochentag: heute, am Wochenende Montag', () => {
    expect(defaultDay('2026-11-25')).toBe(3)
    expect(defaultDay('2026-11-28')).toBe(1)
    expect(defaultDay('2026-11-29')).toBe(1)
  })

  it('Felder pro Tag, Uhrzeiten und Köpfe für alle Tage', () => {
    let cells: TimetableCell[] = []
    cells = setCell(cells, 1, 0, 'a', ' Arbeit ', 'p1')
    cells = setCell(cells, 2, 0, 'time', '08:15', 'p1')
    cells = setCell(cells, 3, HEADER_ROW, 'b', 'Chris', 'p1')
    const texts = cellTexts(cells)
    expect(cellText(texts, 1, 0, 'a')).toBe('Arbeit')
    expect(cellText(texts, 2, 0, 'a')).toBe('')
    expect(cellText(texts, 5, 0, 'time')).toBe('08:15')
    expect(cellText(texts, 1, HEADER_ROW, 'b')).toBe('Chris')
    expect(cells.map((c) => c.id)).toEqual([cellId(1, 0, 'a'), cellId(null, 0, 'time'), cellId(null, HEADER_ROW, 'b')])
  })

  it('leer oder Voreinstellung setzt das Feld zurück (Tombstone), gleicher Text ändert nichts', () => {
    let cells = setCell([], 1, 0, 'time', '07:30', 'p1')
    const same = setCell(cells, 1, 0, 'time', '07:30', 'p1')
    expect(same).toBe(cells)
    cells = setCell(cells, 1, 0, 'time', '08:00', 'p1')
    expect(cells[0].deleted).toBe(true)
    expect(cellText(cellTexts(cells), 1, 0, 'time')).toBe('08:00')
    expect(setCell([], 1, 2, 'a', '   ', 'p1')).toEqual([])
    cells = setCell(cells, 1, 0, 'time', '09:00', 'p1')
    expect(cells[0]).toMatchObject({ deleted: false, text: '09:00' })
  })
})
