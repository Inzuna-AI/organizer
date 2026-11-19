// Synchronisation mit data.json im Daten-Repo.
// - Lesen mit ETag (304 = unverändert), Schreiben mit SHA
// - Änderungen werden ~2 s gebündelt (Debounce)
// - Bei Konflikt (409/422): neu laden, zusammenführen, erneut schreiben (max. 3 Versuche)
// - Offline: Änderungen bleiben im Cache (dirty) und werden später gespeichert

import type { DataFile } from '@/types/data'
import {
  describeError,
  isConflict,
  NetworkError,
  readFile as ghReadFile,
  writeFile as ghWriteFile,
  type RepoConfig,
} from './github'
import { mergeData, normalizeData, pruneTombstones, serializeData } from './merge'
import { backupPath, isTooNew, migrate, needsMigration, schemaOf } from './migrations'
import { berlinDateString, nowIso } from './dates'
import type { CacheState } from './storage'

export const DATA_PATH = 'data.json'
export const MAX_ATTEMPTS = 3
export const DEFAULT_DEBOUNCE_MS = 2000
export const DEFAULT_POLL_MS = 30_000

export type SyncStatus = 'idle' | 'syncing' | 'saving' | 'offline' | 'error' | 'readonly'

export interface SyncState {
  status: SyncStatus
  /** Lokale Änderungen warten aufs Speichern */
  dirty: boolean
  lastSyncAt: string | null
  error: string | null
}

export interface SyncApi {
  readFile: typeof ghReadFile
  writeFile: typeof ghWriteFile
}

export interface SyncOptions {
  config: RepoConfig
  deviceName: string
  cache: CacheState
  persist: (cache: CacheState) => void
  onData: (data: DataFile) => void
  onState: (state: SyncState) => void
  api?: SyncApi
  debounceMs?: number
  pollMs?: number
  isOnline?: () => boolean
}

function defaultIsOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false
}

export class SyncEngine {
  private cache: CacheState
  private state: SyncState
  private rev = 0
  private running: Promise<void> | null = null
  private again = false
  private pushTimer: ReturnType<typeof setTimeout> | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private cleanups: Array<() => void> = []
  private readonly api: SyncApi
  private readonly debounceMs: number
  private pollMs: number
  private readonly isOnline: () => boolean

  constructor(private readonly opts: SyncOptions) {
    this.cache = { ...opts.cache }
    this.api = opts.api ?? { readFile: ghReadFile, writeFile: ghWriteFile }
    this.debounceMs = opts.debounceMs ?? DEFAULT_DEBOUNCE_MS
    this.pollMs = opts.pollMs ?? DEFAULT_POLL_MS
    this.isOnline = opts.isOnline ?? defaultIsOnline
    this.state = {
      status: 'idle',
      dirty: this.cache.dirty,
      lastSyncAt: this.cache.lastSyncAt,
      error: null,
    }
  }

  get data(): DataFile {
    return this.cache.data
  }

  get snapshot(): SyncState {
    return this.state
  }

  get readOnly(): boolean {
    return this.state.status === 'readonly'
  }

  // ---------- lokale Änderungen ----------

  /** Änderung anwenden (optimistisch), im Cache sichern und gebündelt speichern. */
  update(mutator: (data: DataFile) => DataFile): boolean {
    if (this.readOnly) return false
    const next = mutator(this.cache.data)
    this.rev += 1
    this.cache = { ...this.cache, data: next, dirty: true }
    this.persist()
    this.opts.onData(next)
    this.setState({ dirty: true })
    this.schedulePush()
    return true
  }

  private schedulePush(): void {
    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null
      void this.sync()
    }, this.debounceMs)
  }

  // ---------- Synchronisieren ----------

  /** Startet einen Sync. Läuft schon einer, wird danach noch einmal synchronisiert. */
  sync(): Promise<void> {
    if (this.running) {
      this.again = true
      return this.running
    }
    this.running = (async () => {
      try {
        do {
          this.again = false
          await this.runOnce()
        } while (this.again)
      } finally {
        this.running = null
      }
    })()
    return this.running
  }

  private async runOnce(): Promise<void> {
    if (!this.isOnline()) {
      this.setState({ status: 'offline' })
      return
    }
    if (this.pushTimer && this.cache.dirty) {
      // Ein Sync läuft jetzt ohnehin, der gebündelte Push ist damit erledigt.
      clearTimeout(this.pushTimer)
      this.pushTimer = null
    }
    const startRev = this.rev
    this.setState({ status: this.cache.dirty ? 'saving' : 'syncing', error: null })

    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const res = await this.api.readFile(
          this.opts.config,
          DATA_PATH,
          attempt === 0 ? this.cache.etag : null,
        )

        let remote: DataFile | null = null
        let remoteText: string | null = null
        let sha = this.cache.sha
        let etag = this.cache.etag

        if (res.kind === 'not-modified') {
          if (!this.cache.dirty) {
            this.finish()
            return
          }
        } else if (res.kind === 'missing') {
          sha = null
          etag = null
        } else {
          sha = res.sha
          etag = res.etag
          remoteText = res.text
          if (res.text.trim()) {
            try {
              remote = normalizeData(JSON.parse(res.text))
            } catch {
              throw new Error('data.json im Daten-Repo ist kein gültiges JSON.')
            }
          }
        }

        // Daten sind neuer als die App → nur lesen, nichts schreiben.
        if (remote && isTooNew(remote)) {
          this.cache = { ...this.cache, data: remote, sha, etag, dirty: false }
          this.persist()
          this.opts.onData(remote)
          this.setState({
            status: 'readonly',
            dirty: false,
            error: `Die Daten stammen von einer neueren App-Version (Schema ${schemaOf(remote)}). Bitte die App neu laden.`,
          })
          return
        }

        // Ältere Daten → vorher Sicherung anlegen, dann migrieren.
        let migrated = false
        if (remote && remoteText !== null && needsMigration(remote)) {
          await this.writeBackup(schemaOf(remote), remoteText)
          remote = migrate(remote)
          migrated = true
        }

        const local = this.cache.data
        const merged = remote ? mergeData(local, remote) : local
        const mustWrite = this.cache.dirty || migrated || res.kind === 'missing'

        if (!mustWrite) {
          this.applyRemote(merged, sha, etag, startRev)
          this.finish()
          return
        }

        const toWrite = pruneTombstones(merged)
        const text = serializeData(toWrite)
        if (remoteText !== null && text === remoteText) {
          // Nichts Neues zu speichern
          this.applyRemote(toWrite, sha, etag, startRev)
          this.markClean(startRev)
          this.finish()
          return
        }

        try {
          const { sha: newSha } = await this.api.writeFile(
            this.opts.config,
            DATA_PATH,
            text,
            sha,
            `update von ${this.opts.deviceName}`,
          )
          // ETag gilt nach dem Schreiben nicht mehr; der nächste Abruf holt neu.
          this.applyRemote(toWrite, newSha, null, startRev)
          this.markClean(startRev)
          this.finish()
          return
        } catch (e) {
          if (isConflict(e)) {
            // SHA veraltet: neu laden und erneut zusammenführen
            this.cache = { ...this.cache, etag: null }
            continue
          }
          throw e
        }
      }
      this.setState({
        status: 'error',
        error: 'Speichern nach mehreren Versuchen fehlgeschlagen. Es wird später erneut versucht.',
      })
    } catch (e) {
      if (e instanceof NetworkError) {
        this.setState({ status: 'offline' })
      } else {
        this.setState({ status: 'error', error: describeError(e) })
      }
    }
  }

  /** Übernimmt den gespeicherten/geladenen Stand, ohne lokale Änderungen während des Syncs zu verlieren. */
  private applyRemote(data: DataFile, sha: string | null, etag: string | null, startRev: number): void {
    const next = this.rev === startRev ? data : mergeData(this.cache.data, data)
    this.cache = { ...this.cache, data: next, sha, etag }
    this.persist()
    this.opts.onData(next)
  }

  private markClean(startRev: number): void {
    if (this.rev === startRev) {
      this.cache = { ...this.cache, dirty: false }
    } else {
      // Während des Speicherns kam eine neue Änderung → gleich noch einmal
      this.again = true
    }
  }

  private finish(): void {
    const lastSyncAt = nowIso()
    this.cache = { ...this.cache, lastSyncAt }
    this.persist()
    this.setState({ status: 'idle', dirty: this.cache.dirty, lastSyncAt, error: null })
  }

  private async writeBackup(fromVersion: number, text: string): Promise<void> {
    try {
      await this.api.writeFile(
        this.opts.config,
        backupPath(fromVersion, berlinDateString()),
        text,
        null,
        `sicherung vor migration (schema ${fromVersion})`,
      )
    } catch (e) {
      // Sicherung von heute existiert schon → in Ordnung
      if (!isConflict(e)) throw e
    }
  }

  private persist(): void {
    this.opts.persist(this.cache)
  }

  private setState(patch: Partial<SyncState>): void {
    this.state = { ...this.state, ...patch }
    this.opts.onState(this.state)
  }

  // ---------- Lebenszyklus ----------

  /** Startet Polling und Listener (sichtbar/unsichtbar, online/offline) und synchronisiert sofort. */
  start(): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const onVisibility = () => {
        if (document.visibilityState === 'visible') void this.sync()
        // Beim Verlassen der App wartende Änderungen sofort speichern
        else if (this.cache.dirty) void this.sync()
      }
      const onOnline = () => void this.sync()
      const onOffline = () => this.setState({ status: 'offline' })
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
      this.cleanups.push(
        () => document.removeEventListener('visibilitychange', onVisibility),
        () => window.removeEventListener('online', onOnline),
        () => window.removeEventListener('offline', onOffline),
      )
    }
    this.restartPolling()
    void this.sync()
  }

  /** Polling-Intervall ändern, z. B. 10 s, solange der Einkaufszettel offen ist. */
  setPollInterval(ms: number): void {
    this.pollMs = ms
    this.restartPolling()
  }

  private restartPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => {
      const visible = typeof document === 'undefined' || document.visibilityState === 'visible'
      if (visible) void this.sync()
    }, this.pollMs)
  }

  stop(): void {
    if (this.pushTimer) clearTimeout(this.pushTimer)
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pushTimer = null
    this.pollTimer = null
    for (const c of this.cleanups) c()
    this.cleanups = []
  }
}
