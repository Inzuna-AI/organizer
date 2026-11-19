import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GitHubError, NetworkError, type ReadResult } from './github'
import { serializeData } from './merge'
import { gitBlobSha } from './sha1'
import { SyncEngine, type SyncApi, type SyncState } from './sync'
import type { CacheState } from './storage'
import type { DataFile } from '@/types/data'
import { emptyData, room, withRooms } from './testdata'

const cfg = { owner: 'me', repo: 'organizer-data', token: 't' }
const T1 = '2026-11-19T10:00:00.000Z'
const T2 = '2026-11-19T11:00:00.000Z'

/** Simuliertes Daten-Repo mit SHA-Prüfung wie bei GitHub. */
class FakeRepo {
  files = new Map<string, string>()
  writes: Array<{ path: string; message: string }> = []
  offline = false

  sha(path: string): string | null {
    const t = this.files.get(path)
    return t === undefined ? null : gitBlobSha(new TextEncoder().encode(t))
  }

  setData(d: DataFile) {
    this.files.set('data.json', serializeData(d))
  }

  data(): DataFile {
    return JSON.parse(this.files.get('data.json')!)
  }

  api: SyncApi = {
    readFile: async (_cfg, path, etag): Promise<ReadResult> => {
      if (this.offline) throw new NetworkError()
      const text = this.files.get(path)
      if (text === undefined) return { kind: 'missing' }
      const sha = this.sha(path)!
      if (etag && etag === `"${sha}"`) return { kind: 'not-modified' }
      return { kind: 'ok', text, sha, etag: `"${sha}"` }
    },
    writeFile: async (_cfg, path, text, sha, message) => {
      if (this.offline) throw new NetworkError()
      const current = this.sha(path)
      if (current !== null && sha !== current) throw new GitHubError(409, 'sha mismatch')
      if (current === null && sha !== null) throw new GitHubError(422, 'sha given')
      this.files.set(path, text)
      this.writes.push({ path, message })
      return { sha: this.sha(path)! }
    },
  }
}

function makeEngine(repo: FakeRepo, initial: DataFile, extra: Partial<CacheState> = {}) {
  const states: SyncState[] = []
  let persisted: CacheState | null = null
  let shown: DataFile | null = null
  const engine = new SyncEngine({
    config: cfg,
    deviceName: 'Testgerät',
    cache: { data: initial, sha: null, etag: null, dirty: false, lastSyncAt: null, ...extra },
    persist: (c) => (persisted = c),
    onData: (d) => (shown = d),
    onState: (s) => states.push(s),
    api: repo.api,
    debounceMs: 2000,
    isOnline: () => !repo.offline,
  })
  return {
    engine,
    states,
    get persisted() {
      return persisted
    },
    get shown() {
      return shown
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('SyncEngine', () => {
  it('lädt beim ersten Sync den entfernten Stand', async () => {
    const repo = new FakeRepo()
    repo.setData(withRooms(room('a', 'Küche', T1)))
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    expect(t.engine.data.rooms.map((r) => r.name)).toEqual(['Küche'])
    expect(t.engine.snapshot.status).toBe('idle')
    expect(repo.writes).toHaveLength(0)
  })

  it('Schema 1 im Repo: erst Sicherung, dann migriert speichern', async () => {
    const repo = new FakeRepo()
    const old = { ...withRooms(room('a', 'Küche', T1)), schemaVersion: 1 } as Partial<DataFile>
    delete old.events
    repo.files.set('data.json', serializeData(old as DataFile))
    const before = repo.files.get('data.json')
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    expect(repo.writes.map((w) => w.path)).toEqual([expect.stringMatching(/^backups\/data-schema1-\d{4}-\d{2}-\d{2}\.json$/), 'data.json'])
    expect(repo.files.get(repo.writes[0].path)).toBe(before)
    expect(repo.data().schemaVersion).toBe(2)
    expect(repo.data().events).toEqual([])
    expect(repo.data().rooms.map((r) => r.name)).toEqual(['Küche'])
  })

  it('nutzt den ETag: Ein unveränderter Stand löst keinen Schreibvorgang aus', async () => {
    const repo = new FakeRepo()
    repo.setData(withRooms(room('a', 'Küche', T1)))
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    const spy = vi.spyOn(repo.api, 'readFile')
    await t.engine.sync()
    expect(await spy.mock.results[0].value).toEqual({ kind: 'not-modified' })
    expect(repo.writes).toHaveLength(0)
  })

  it('bündelt Änderungen per Debounce zu einem Commit', async () => {
    const repo = new FakeRepo()
    repo.setData(emptyData())
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()

    t.engine.update((d) => ({ ...d, rooms: [room('a', 'Küche', T1)] }))
    t.engine.update((d) => ({ ...d, rooms: [...d.rooms, room('b', 'Bad', T1)] }))
    expect(t.engine.snapshot.dirty).toBe(true)
    expect(t.shown?.rooms).toHaveLength(2) // optimistisch sofort sichtbar
    expect(repo.writes).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(2000)
    expect(repo.writes).toHaveLength(1)
    expect(repo.writes[0].message).toBe('update von Testgerät')
    expect(repo.data().rooms).toHaveLength(2)
    expect(t.engine.snapshot.dirty).toBe(false)
  })

  it('führt bei Konflikt zusammen und schreibt erneut', async () => {
    const repo = new FakeRepo()
    repo.setData(withRooms(room('a', 'Küche', T1)))
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()

    // Die andere Person ändert gleichzeitig etwas
    repo.setData(withRooms(room('a', 'Küche', T1), room('b', 'Bad (Lena)', T2)))
    t.engine.update((d) => ({ ...d, rooms: [...d.rooms, room('c', 'Flur (ich)', T2)] }))
    await t.engine.sync()

    const ids = repo.data().rooms.map((r) => r.id).sort()
    expect(ids).toEqual(['a', 'b', 'c'])
    expect(t.engine.snapshot.dirty).toBe(false)
    expect(t.engine.snapshot.status).toBe('idle')
  })

  it('gibt nach 3 Konflikten auf und behält die Änderung in der Warteschlange', async () => {
    const repo = new FakeRepo()
    repo.setData(emptyData())
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    repo.api.writeFile = async () => {
      throw new GitHubError(409, 'conflict')
    }
    t.engine.update((d) => ({ ...d, rooms: [room('a', 'Küche', T1)] }))
    await t.engine.sync()
    expect(t.engine.snapshot.status).toBe('error')
    expect(t.engine.snapshot.dirty).toBe(true)
  })

  it('speichert offline in der Warteschlange und synchronisiert später', async () => {
    const repo = new FakeRepo()
    repo.setData(emptyData())
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()

    repo.offline = true
    t.engine.update((d) => ({ ...d, rooms: [room('a', 'Küche', T1)] }))
    await t.engine.sync()
    expect(t.engine.snapshot.status).toBe('offline')
    expect(t.persisted?.dirty).toBe(true)
    expect(t.persisted?.data.rooms).toHaveLength(1)

    repo.offline = false
    await t.engine.sync()
    expect(repo.data().rooms).toHaveLength(1)
    expect(t.engine.snapshot.dirty).toBe(false)
  })

  it('legt data.json an, wenn sie fehlt', async () => {
    const repo = new FakeRepo()
    const t = makeEngine(repo, withRooms(room('a', 'Küche', T1)))
    await t.engine.sync()
    expect(repo.data().rooms).toHaveLength(1)
  })

  it('lässt eine Löschung nicht durch einen alten Stand zurückkommen', async () => {
    const repo = new FakeRepo()
    repo.setData(withRooms(room('a', 'Küche', T1)))
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    // Lena löscht den Raum
    repo.setData(withRooms(room('a', 'Küche', T2, true)))
    // Ich ändere einen anderen Raum, mein Stand kennt die Löschung noch nicht
    t.engine.update((d) => ({ ...d, rooms: [...d.rooms, room('b', 'Bad', T2)] }))
    await t.engine.sync()
    expect(repo.data().rooms.find((r) => r.id === 'a')?.deleted).toBe(true)
  })

  it('wechselt bei zu neuer schemaVersion in den Nur-Lesen-Modus', async () => {
    const repo = new FakeRepo()
    repo.setData({ ...emptyData(), schemaVersion: 99 })
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()
    expect(t.engine.snapshot.status).toBe('readonly')
    expect(t.engine.update((d) => d)).toBe(false)
    expect(repo.writes).toHaveLength(0)
  })

  it('verliert keine Änderung, die während des Speicherns passiert', async () => {
    const repo = new FakeRepo()
    repo.setData(emptyData())
    const t = makeEngine(repo, emptyData())
    await t.engine.sync()

    const origWrite = repo.api.writeFile
    let injected = false
    repo.api.writeFile = async (...args) => {
      if (!injected) {
        injected = true
        t.engine.update((d) => ({ ...d, rooms: [...d.rooms, room('b', 'Bad', T2)] }))
      }
      return origWrite(...args)
    }
    t.engine.update((d) => ({ ...d, rooms: [room('a', 'Küche', T1)] }))
    await t.engine.sync()
    expect(repo.data().rooms.map((r) => r.id).sort()).toEqual(['a', 'b'])
    expect(t.engine.snapshot.dirty).toBe(false)
  })
})
