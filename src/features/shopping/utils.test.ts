import { describe, expect, it } from 'vitest'
import type { ShoppingItem } from '@/types/data'
import { nameKey, nextOpenSortOrder, planAdd, reorderChanges, splitItems, suggest } from './utils'

let n = 0
function item(p: Partial<ShoppingItem>): ShoppingItem {
  n++
  return {
    id: `i${n}`,
    updatedAt: '2026-11-19T10:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    listId: 'L',
    name: `Artikel ${n}`,
    quantity: '',
    note: '',
    checked: false,
    checkedAt: null,
    sortOrder: n,
    ...p,
  }
}

describe('nameKey', () => {
  it('ignoriert Groß-/Kleinschreibung und Leerzeichen', () => {
    expect(nameKey('  Milch  ')).toBe('milch')
    expect(nameKey('Äpfel  rot')).toBe('äpfel rot')
  })
})

describe('splitItems', () => {
  it('offene nach sortOrder, erledigte nach checkedAt absteigend, nur diese Liste', () => {
    const items = [
      item({ id: 'a', sortOrder: 2 }),
      item({ id: 'b', sortOrder: 1 }),
      item({ id: 'c', checked: true, checkedAt: '2026-11-19T09:00:00Z' }),
      item({ id: 'd', checked: true, checkedAt: '2026-11-19T11:00:00Z' }),
      item({ id: 'e', listId: 'X' }),
      item({ id: 'f', deleted: true }),
    ]
    const { open, checked } = splitItems(items, 'L')
    expect(open.map((i) => i.id)).toEqual(['b', 'a'])
    expect(checked.map((i) => i.id)).toEqual(['d', 'c'])
  })
})

describe('nextOpenSortOrder', () => {
  it('hängt hinter den höchsten offenen Artikel an', () => {
    const items = [item({ sortOrder: 3 }), item({ sortOrder: 9, checked: true }), item({ sortOrder: 12, listId: 'X' })]
    expect(nextOpenSortOrder(items, 'L')).toBe(4)
    expect(nextOpenSortOrder([], 'L')).toBe(1)
  })
})

describe('planAdd', () => {
  it('erkennt offene, öffnet abgehakte wieder und legt sonst neu an', () => {
    const items = [
      item({ id: 'm', name: 'Milch' }),
      item({ id: 'b', name: 'Brot', checked: true, checkedAt: '2026-11-18T10:00:00Z' }),
      item({ id: 'k', name: 'Käse', deleted: true, checked: true }),
    ]
    expect(planAdd(items, 'L', ' milch ')).toEqual({ kind: 'exists', id: 'm' })
    expect(planAdd(items, 'L', 'BROT')).toEqual({ kind: 'reopen', id: 'b' })
    expect(planAdd(items, 'L', 'Käse')).toEqual({ kind: 'create' })
    expect(planAdd(items, 'X', 'Milch')).toEqual({ kind: 'create' })
  })
})

describe('suggest', () => {
  const items = [
    item({ id: 'o', name: 'Milch' }), // offen → kein Vorschlag
    item({ id: 'h', name: 'Hafermilch', checked: true, checkedAt: '2026-11-18T10:00:00Z' }),
    item({ id: 'mz', name: 'Mozzarella', checked: true, checkedAt: '2026-11-17T10:00:00Z', quantity: '2' }),
    item({ id: 'mo', name: 'Möhren', deleted: true, checked: true, checkedAt: '2026-11-10T10:00:00Z' }),
    item({ id: 'x', name: 'Mehl', checked: true, listId: 'X', checkedAt: '2026-11-16T10:00:00Z' }),
  ]

  it('Treffer am Anfang zuerst, offene ausgeschlossen', () => {
    const s = suggest(items, 'L', 'm')
    expect(s.map((x) => x.name)).toEqual(['Mozzarella', 'Mehl', 'Möhren', 'Hafermilch'])
  })

  it('abgehakte dieser Liste werden wieder geöffnet, andere neu angelegt', () => {
    const s = suggest(items, 'L', 'm')
    expect(s.find((x) => x.name === 'Mozzarella')?.reopenId).toBe('mz')
    expect(s.find((x) => x.name === 'Möhren')?.reopenId).toBeNull()
    expect(s.find((x) => x.name === 'Mozzarella')?.quantity).toBe('2')
  })

  it('leere Eingabe → keine Vorschläge, exakter Treffer wird nicht vorgeschlagen', () => {
    expect(suggest(items, 'L', '  ')).toEqual([])
    expect(suggest(items, 'L', 'mehl')).toEqual([])
  })

  it('gleicher Name nur einmal, Wiederöffnen bevorzugt', () => {
    const dup = [
      item({ id: 'a', name: 'Eier', deleted: true, checked: true, checkedAt: '2026-11-19T10:00:00Z' }),
      item({ id: 'b', name: 'eier', checked: true, checkedAt: '2026-11-01T10:00:00Z' }),
    ]
    const s = suggest(dup, 'L', 'ei')
    expect(s).toHaveLength(1)
    expect(s[0].reopenId).toBe('b')
  })
})

describe('reorderChanges', () => {
  it('liefert nur geänderte Positionen', () => {
    const open = [item({ id: 'a', sortOrder: 1 }), item({ id: 'b', sortOrder: 2 }), item({ id: 'c', sortOrder: 3 })]
    expect([...reorderChanges(open, ['a', 'c', 'b'])]).toEqual([
      ['c', 2],
      ['b', 3],
    ])
    expect(reorderChanges(open, ['a', 'b', 'c']).size).toBe(0)
  })
})

describe('„Nächster Einkauf“', () => {
  it('eigener Bereich, nicht unter offen; eigene sortOrder', () => {
    const items = [
      item({ id: 'a', sortOrder: 1 }),
      item({ id: 'l1', later: true, sortOrder: 7 }),
      item({ id: 'l2', later: true, sortOrder: 3 }),
      item({ id: 'c', later: true, checked: true, checkedAt: '2026-11-19T09:00:00Z' }),
    ]
    const { open, later, checked } = splitItems(items, 'L')
    expect(open.map((i) => i.id)).toEqual(['a'])
    expect(later.map((i) => i.id)).toEqual(['l2', 'l1'])
    expect(checked.map((i) => i.id)).toEqual(['c'])
    expect(nextOpenSortOrder(items, 'L')).toBe(2)
    expect(nextOpenSortOrder(items, 'L', true)).toBe(8)
  })

  it('planAdd holt zurückgestellte auf die Liste bzw. erkennt sie beim Anlegen für später', () => {
    const items = [item({ id: 'm', name: 'Milch', later: true })]
    expect(planAdd(items, 'L', 'milch')).toEqual({ kind: 'reopen', id: 'm' })
    expect(planAdd(items, 'L', 'milch', true)).toEqual({ kind: 'exists', id: 'm' })
  })

  it('suggest schlägt zurückgestellte vor (mit reopenId, vor abgehakten)', () => {
    const items = [
      item({ id: 'c', name: 'Milch', checked: true, checkedAt: '2026-11-19T10:00:00Z' }),
      item({ id: 'm', name: 'milch', later: true }),
    ]
    const s = suggest(items, 'L', 'mi')
    expect(s).toHaveLength(1)
    expect(s[0]).toMatchObject({ reopenId: 'm', later: true })
  })
})
