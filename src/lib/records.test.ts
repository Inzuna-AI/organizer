import { describe, expect, it } from 'vitest'
import { alive, newBase, tombstone, touch, updateById, upsert, uuid } from './records'
import { room } from './testdata'

describe('records', () => {
  it('erzeugt UUIDs', () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(uuid()).not.toBe(uuid())
  })

  it('stempelt Änderungen mit updatedAt und updatedBy', () => {
    const r = room('a', 'Küche', '2020-01-01T00:00:00.000Z')
    const t = touch(r, 'p1', { name: 'Küche neu' })
    expect(t.name).toBe('Küche neu')
    expect(t.updatedBy).toBe('p1')
    expect(t.updatedAt > r.updatedAt).toBe(true)
  })

  it('löscht als Tombstone', () => {
    const r = room('a', 'Küche', '2020-01-01T00:00:00.000Z')
    const t = tombstone(r, 'p1')
    expect(t.deleted).toBe(true)
    expect(alive([r, t])).toEqual([r])
  })

  it('ersetzt oder hängt an', () => {
    const a = room('a', 'A', '2020-01-01T00:00:00.000Z')
    const b = room('b', 'B', '2020-01-01T00:00:00.000Z')
    expect(upsert([a], b)).toHaveLength(2)
    expect(upsert([a, b], { ...a, name: 'A2' })[0].name).toBe('A2')
  })

  it('ändert per id', () => {
    const list = [room('a', 'A', '2020-01-01T00:00:00.000Z'), room('b', 'B', '2020-01-01T00:00:00.000Z')]
    const out = updateById(list, 'b', 'p1', (r) => ({ name: r.name + '!' }))
    expect(out[1].name).toBe('B!')
    expect(out[0]).toBe(list[0])
  })

  it('legt Basisfelder an', () => {
    const b = newBase('p1')
    expect(b.createdBy).toBe('p1')
    expect(b.deleted).toBe(false)
  })
})
