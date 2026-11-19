import { describe, expect, it } from 'vitest'
import type { DataFile, Room } from '@/types/data'
import { describeBackup, exportText, mergeImport, parseBackup, restoreImport } from './backup'

function room(id: string, name: string, updatedAt: string, deleted = false): Room {
  return { id, name, updatedAt, deleted, createdBy: null, updatedBy: null, color: '#000', icon: '', sortOrder: 0 }
}

function data(rooms: Room[], extra: Partial<DataFile> = {}): DataFile {
  return {
    schemaVersion: 2,
    persons: [],
    rooms,
    tasks: [],
    occurrences: [],
    events: [],
    shoppingLists: [],
    shoppingItems: [],
    devices: [],
    ...extra,
  }
}

describe('parseBackup', () => {
  it('liest einen Export wieder ein', () => {
    const d = data([room('a', 'Küche', '2026-11-01T00:00:00Z')])
    const r = parseBackup(exportText(d))
    expect(r).toEqual({ ok: true, data: d })
  })

  it('ergänzt fehlende Sammlungen', () => {
    const r = parseBackup(JSON.stringify({ rooms: [room('a', 'Bad', 'x')] }))
    expect(r.ok && r.data.tasks).toEqual([])
    expect(r.ok && r.data.schemaVersion).toBe(2)
  })

  it('lehnt kaputte oder fremde Dateien ab', () => {
    expect(parseBackup('{kein json').ok).toBe(false)
    expect(parseBackup('[1,2]').ok).toBe(false)
    expect(parseBackup('{"foo": 1}').ok).toBe(false)
    expect(parseBackup('{"rooms": [{"name": "ohne id"}]}').ok).toBe(false)
  })

  it('lehnt Sicherungen einer neueren App-Version ab', () => {
    const r = parseBackup(JSON.stringify({ ...data([]), schemaVersion: 99 }))
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toContain('neueren App-Version')
  })
})

describe('describeBackup', () => {
  it('zählt nur nicht gelöschte Einträge', () => {
    expect(describeBackup(data([room('a', 'x', 't'), room('b', 'y', 't', true)]))).toBe(
      '0 Aufgaben, 1 Räume, 0 Personen, 0 Einkaufsartikel',
    )
  })
})

describe('mergeImport', () => {
  it('neuerer Stand gewinnt, Geräte bleiben', () => {
    const device = { id: 'd' } as DataFile['devices'][number]
    const current = data([room('a', 'Küche neu', '2026-11-10T00:00:00Z')], { devices: [device] })
    const backup = data([room('a', 'Küche alt', '2026-11-01T00:00:00Z'), room('b', 'Bad', '2026-11-01T00:00:00Z')])
    const out = mergeImport(current, backup)
    expect(out.rooms.map((r) => r.name).sort()).toEqual(['Bad', 'Küche neu'])
    expect(out.devices).toEqual([device])
  })
})

describe('restoreImport', () => {
  const now = '2026-11-19T12:00:00.000Z'

  it('stellt den Stand der Sicherung her und löscht Neueres', () => {
    const current = data([
      room('a', 'Küche geändert', '2026-11-10T00:00:00Z'),
      room('c', 'Neu angelegt', '2026-11-12T00:00:00Z'),
      room('z', 'Alt gelöscht', '2026-11-01T00:00:00Z', true),
    ])
    const backup = data([room('a', 'Küche', '2026-11-01T00:00:00Z'), room('b', 'Bad', '2026-11-01T00:00:00Z')])
    const out = restoreImport(current, backup, 'me', now)
    const byId = new Map(out.rooms.map((r) => [r.id, r]))

    expect(byId.get('a')).toMatchObject({ name: 'Küche', updatedAt: now, updatedBy: 'me', deleted: false })
    expect(byId.get('b')).toMatchObject({ name: 'Bad', updatedAt: now })
    expect(byId.get('c')).toMatchObject({ deleted: true, updatedAt: now, updatedBy: 'me' })
    // vorhandene Tombstones bleiben unverändert
    expect(byId.get('z')).toMatchObject({ deleted: true, updatedAt: '2026-11-01T00:00:00Z' })
  })

  it('wiederhergestellte Einträge gewinnen beim nächsten Sync gegen den alten Stand', async () => {
    const { mergeData } = await import('./merge')
    const remote = data([room('a', 'Küche geändert', '2026-11-10T00:00:00Z')])
    const restored = restoreImport(remote, data([room('a', 'Küche', '2026-11-01T00:00:00Z')]), 'me', now)
    expect(mergeData(restored, remote).rooms[0].name).toBe('Küche')
  })
})
