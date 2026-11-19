// Zentraler Store: verbindet Daten, Gerät und Sync.
// Komponenten greifen nur hierüber auf Daten zu, nie direkt auf github.ts.

import { create } from 'zustand'
import type { DataFile } from '@/types/data'
import {
  checkRepoAccess,
  describeError,
  readFile,
  writeFile,
  type RepoConfig,
} from '@/lib/github'
import { normalizeData, serializeData } from '@/lib/merge'
import { isTooNew } from '@/lib/migrations'
import * as storage from '@/lib/storage'
import { DATA_PATH, SyncEngine, type SyncState } from '@/lib/sync'
import { createInitialData, createPersons } from './initialData'

export type Phase = 'loading' | 'setup' | 'ready'

export interface AppState {
  phase: Phase
  config: RepoConfig | null
  device: storage.DeviceInfo | null
  data: DataFile | null
  sync: SyncState
  /** true, wenn die Einrichtung aus den Einstellungen heraus geöffnet wurde */
  reconfiguring: boolean

  init: () => void
  completeSetup: (args: {
    config: RepoConfig
    device: storage.DeviceInfo
    data: DataFile
    sha: string | null
  }) => void
  /** Daten ändern (optimistisch, Sync im Hintergrund) */
  update: (mutator: (data: DataFile) => DataFile) => boolean
  syncNow: () => Promise<void>
  setDevice: (device: storage.DeviceInfo) => void
  reconfigure: () => void
  cancelReconfigure: () => void
  removeToken: () => void
}

const initialSync: SyncState = { status: 'idle', dirty: false, lastSyncAt: null, error: null }

let engine: SyncEngine | null = null

export const useAppStore = create<AppState>()((set, get) => {
  function startEngine(config: RepoConfig, device: storage.DeviceInfo, cache: storage.CacheState) {
    engine?.stop()
    engine = new SyncEngine({
      config,
      deviceName: device.deviceName,
      cache,
      persist: storage.saveCache,
      onData: (data) => set({ data }),
      onState: (sync) => set({ sync }),
    })
    set({ data: cache.data, sync: engine.snapshot, phase: 'ready', reconfiguring: false })
    engine.start()
  }

  return {
    phase: 'loading',
    config: null,
    device: null,
    data: null,
    sync: initialSync,
    reconfiguring: false,

    init: () => {
      const config = storage.loadConfig()
      const device = storage.loadDevice()
      const cache = storage.loadCache()
      set({ config, device })
      if (config?.token && device?.personId && cache?.data) {
        startEngine(config, device, cache)
      } else {
        set({ phase: 'setup' })
      }
    },

    completeSetup: ({ config, device, data, sha }) => {
      storage.saveConfig(config)
      storage.saveDevice(device)
      // ETag bewusst leer: Der erste Sync liest frisch und migriert bei Bedarf.
      const cache: storage.CacheState = { data, sha, etag: null, dirty: false, lastSyncAt: null }
      storage.saveCache(cache)
      set({ config, device })
      startEngine(config, device, cache)
    },

    update: (mutator) => engine?.update(mutator) ?? false,

    syncNow: async () => {
      await engine?.sync()
    },

    setDevice: (device) => {
      storage.saveDevice(device)
      set({ device })
      const { config } = get()
      // Gerätename steckt in den Commit-Messages → Engine mit neuem Namen starten
      if (config && engine) {
        const cache = storage.loadCache()
        if (cache) startEngine(config, device, cache)
      }
    },

    reconfigure: () => {
      engine?.stop()
      engine = null
      set({ phase: 'setup', reconfiguring: true })
    },

    cancelReconfigure: () => {
      const { config, device } = get()
      const cache = storage.loadCache()
      if (config?.token && device && cache) startEngine(config, device, cache)
    },

    removeToken: () => {
      engine?.stop()
      engine = null
      const { config } = get()
      const without = config ? { ...config, token: '' } : null
      storage.saveConfig(without)
      set({ config: without, phase: 'setup', reconfiguring: false })
    },
  }
})

/** Aktuelle Person dieses Geräts („Das bin ich“). */
export function useMe() {
  return useAppStore((s) => s.data?.persons.find((p) => p.id === s.device?.personId) ?? null)
}

// ---------- Einrichtung ----------

export type ConnectionResult =
  | { kind: 'existing'; data: DataFile; sha: string }
  | { kind: 'empty'; sha: string | null }

/** „Verbindung testen“: prüft Repo-Zugriff und liest data.json. */
export async function testConnection(config: RepoConfig): Promise<ConnectionResult> {
  try {
    await checkRepoAccess(config)
    const res = await readFile(config, DATA_PATH)
    if (res.kind === 'missing') return { kind: 'empty', sha: null }
    if (res.kind === 'not-modified') throw new Error('Unerwartete Antwort von GitHub')
    if (!res.text.trim()) return { kind: 'empty', sha: res.sha }
    let parsed: unknown
    try {
      parsed = JSON.parse(res.text)
    } catch {
      throw new Error('data.json ist kein gültiges JSON. Bitte im Daten-Repo prüfen.')
    }
    const data = normalizeData(parsed as DataFile)
    if (isTooNew(data)) {
      throw new Error('Die Daten stammen von einer neueren App-Version. Bitte die App neu laden.')
    }
    return { kind: 'existing', data, sha: res.sha }
  } catch (e) {
    throw new Error(describeError(e))
  }
}

/**
 * Legt data.json mit Grundstruktur an oder ergänzt Personen in einer bestehenden Datei.
 * Gibt die geschriebenen Daten und die neue SHA zurück.
 */
export async function writeInitialData(args: {
  config: RepoConfig
  base: DataFile | null
  names: string[]
  sha: string | null
  deviceName: string
}): Promise<{ data: DataFile; sha: string }> {
  const { config, base, names, sha, deviceName } = args
  const data = base
    ? { ...base, persons: [...base.persons, ...createPersons(names, base.persons.length)] }
    : createInitialData(names)
  try {
    const res = await writeFile(config, DATA_PATH, serializeData(data), sha, `einrichtung von ${deviceName}`)
    return { data, sha: res.sha }
  } catch (e) {
    throw new Error(describeError(e))
  }
}
