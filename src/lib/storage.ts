// localStorage: Verbindung (inkl. Token), Geräteangaben, Daten-Cache.
// Alle Zugriffe sind abgesichert, weil localStorage in privaten Fenstern fehlen kann.

import type { RepoConfig } from './github'
import type { DataFile } from '@/types/data'

const KEY_CONFIG = 'organizer.config'
const KEY_DEVICE = 'organizer.device'
const KEY_CACHE = 'organizer.cache'

export interface DeviceInfo {
  /** Person, die dieses Gerät nutzt („Das bin ich“) */
  personId: string
  /** Name des Geräts, z. B. „Lenas iPhone“ (für Commit-Messages) */
  deviceName: string
}

export interface CacheState {
  data: DataFile
  sha: string | null
  etag: string | null
  /** Es gibt lokale Änderungen, die noch nicht gespeichert sind (Warteschlange) */
  dirty: boolean
  lastSyncAt: string | null
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Speicher voll oder nicht verfügbar: App läuft trotzdem weiter
  }
}

export const loadConfig = () => read<RepoConfig>(KEY_CONFIG)
export const saveConfig = (c: RepoConfig | null) => write(KEY_CONFIG, c)

export const loadDevice = () => read<DeviceInfo>(KEY_DEVICE)
export const saveDevice = (d: DeviceInfo | null) => write(KEY_DEVICE, d)

export const loadCache = () => read<CacheState>(KEY_CACHE)
export const saveCache = (c: CacheState | null) => write(KEY_CACHE, c)

/** Kleine Bedien-Einstellungen pro Gerät (Filter, Umschalter). Nie für Daten verwenden. */
export function loadPref<T>(name: string, fallback: T): T {
  return read<T>(`organizer.pref.${name}`) ?? fallback
}

export function savePref(name: string, value: unknown): void {
  write(`organizer.pref.${name}`, value)
}

/** Token maskiert anzeigen: ••••abcd */
export function maskToken(token: string): string {
  if (!token) return ''
  return `••••${token.slice(-4)}`
}
