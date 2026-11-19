import { describe, expect, it } from 'vitest'
import { mergeData, mergeRecords, normalizeData, pickNewer, pruneTombstones } from './merge'
import { emptyData, room, withRooms } from './testdata'

const T1 = '2026-11-19T10:00:00.000Z'
const T2 = '2026-11-19T11:00:00.000Z'
const T3 = '2026-11-19T12:00:00.000Z'

describe('pickNewer', () => {
  it('nimmt den neueren updatedAt', () => {
    expect(pickNewer(room('a', 'lokal', T2), room('a', 'remote', T1)).name).toBe('lokal')
    expect(pickNewer(room('a', 'lokal', T1), room('a', 'remote', T2)).name).toBe('remote')
  })

  it('bei Gleichstand gewinnt die Löschung, sonst remote', () => {
    expect(pickNewer(room('a', 'l', T1, true), room('a', 'r', T1)).deleted).toBe(true)
    expect(pickNewer(room('a', 'l', T1), room('a', 'r', T1, true)).deleted).toBe(true)
    expect(pickNewer(room('a', 'l', T1), room('a', 'r', T1)).name).toBe('r')
  })

  it('vergleicht Zeitstempel unabhängig vom Format', () => {
    const local = room('a', 'lokal', '2026-11-19T12:00:00+01:00') // = 11:00Z
    const remote = room('a', 'remote', '2026-11-19T10:30:00.000Z')
    expect(pickNewer(local, remote).name).toBe('lokal')
  })
})

describe('mergeRecords', () => {
  it('behält Datensätze, die nur auf einer Seite existieren', () => {
    const merged = mergeRecords([room('a', 'A', T1)], [room('b', 'B', T1)])
    expect(merged.map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('führt beide Seiten pro Datensatz zusammen', () => {
    const local = [room('a', 'A lokal neu', T3), room('b', 'B lokal alt', T1)]
    const remote = [room('a', 'A remote alt', T2), room('b', 'B remote neu', T2)]
    const merged = mergeRecords(local, remote)
    expect(merged.find((r) => r.id === 'a')?.name).toBe('A lokal neu')
    expect(merged.find((r) => r.id === 'b')?.name).toBe('B remote neu')
  })

  it('lässt eine Löschung nicht durch einen alten Stand zurückkommen', () => {
    const local = [room('a', 'alt', T1)]
    const remote = [room('a', 'alt', T2, true)]
    expect(mergeRecords(local, remote)[0].deleted).toBe(true)
  })

  it('kommt mit fehlenden Listen zurecht', () => {
    expect(mergeRecords(undefined, [room('a', 'A', T1)])).toHaveLength(1)
  })
})

describe('mergeData', () => {
  it('führt alle Sammlungen zusammen und nimmt die höhere schemaVersion', () => {
    const local = withRooms(room('a', 'A', T1))
    const remote = { ...withRooms(room('b', 'B', T1)), schemaVersion: 1 }
    const merged = mergeData(local, remote)
    expect(merged.rooms).toHaveLength(2)
    expect(merged.tasks).toEqual([])
    expect(merged.schemaVersion).toBe(1)
  })
})

describe('pruneTombstones', () => {
  it('entfernt nur Tombstones, die älter als 30 Tage sind', () => {
    const now = Date.parse('2026-12-31T00:00:00Z')
    const data = withRooms(
      room('alt-geloescht', 'x', '2026-11-01T00:00:00Z', true),
      room('neu-geloescht', 'y', '2026-12-20T00:00:00Z', true),
      room('alt-aktiv', 'z', '2026-01-01T00:00:00Z'),
    )
    const pruned = pruneTombstones(data, now)
    expect(pruned.rooms.map((r) => r.id)).toEqual(['neu-geloescht', 'alt-aktiv'])
  })
})

describe('normalizeData', () => {
  it('ergänzt fehlende Sammlungen', () => {
    const n = normalizeData({ schemaVersion: 1, rooms: [] })
    expect(n).toEqual(emptyData())
  })
})
