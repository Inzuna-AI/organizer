import { describe, expect, it } from 'vitest'
import { room } from '@/lib/testdata'
import { moveRoom, nextSortOrder, sortRooms } from './utils'

const T = '2026-11-19T10:00:00.000Z'
const r = (id: string, sortOrder: number) => ({ ...room(id, id.toUpperCase(), T), sortOrder })

describe('rooms utils', () => {
  it('sortiert nach sortOrder', () => {
    expect(sortRooms([r('b', 2), r('a', 1)]).map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('verschiebt nach oben und unten', () => {
    const rooms = [r('a', 1), r('b', 2), r('c', 3)]
    expect(Object.fromEntries(moveRoom(rooms, 'c', -1))).toEqual({ b: 3, c: 2 })
    expect(Object.fromEntries(moveRoom(rooms, 'a', 1))).toEqual({ a: 2, b: 1 })
  })

  it('ändert nichts am Rand', () => {
    const rooms = [r('a', 1), r('b', 2)]
    expect(moveRoom(rooms, 'a', -1).size).toBe(0)
    expect(moveRoom(rooms, 'b', 1).size).toBe(0)
  })

  it('normalisiert Lücken in der Reihenfolge', () => {
    const rooms = [r('a', 1), r('b', 5), r('c', 9)]
    expect(Object.fromEntries(moveRoom(rooms, 'c', -1))).toEqual({ b: 3, c: 2 })
  })

  it('vergibt die nächste Position', () => {
    expect(nextSortOrder([r('a', 1), r('b', 7)])).toBe(8)
    expect(nextSortOrder([])).toBe(1)
  })
})
