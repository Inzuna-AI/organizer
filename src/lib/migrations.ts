// schemaVersion-Migrationen.
// Neue Migration: Eintrag in MIGRATIONS ergänzen (von Version n auf n+1) und
// CURRENT_SCHEMA_VERSION erhöhen. Vor jeder Migration legt der Sync eine Sicherung an.

import type { DataFile } from '@/types/data'

export const CURRENT_SCHEMA_VERSION = 2

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/** Schlüssel = Ausgangsversion. Beispiel: 1: (d) => ({ ...d, schemaVersion: 2, neuesFeld: [] }) */
export const MIGRATIONS: Record<number, Migration> = {
  // 1 → 2: Termine (events) und die Benachrichtigungs-Einstellung „neuer Termin“
  1: (d) => ({
    ...d,
    events: Array.isArray(d.events) ? d.events : [],
    devices: (Array.isArray(d.devices) ? d.devices : []).map((dev: { notify?: Record<string, unknown> }) =>
      dev.notify && typeof dev.notify.newEvent !== 'boolean'
        ? { ...dev, notify: { ...dev.notify, newEvent: true } }
        : dev,
    ),
  }),
}

export function schemaOf(data: { schemaVersion?: number }): number {
  return typeof data.schemaVersion === 'number' ? data.schemaVersion : 1
}

/** Daten stammen von einer neueren App-Version → Nur-Lesen-Modus. */
export function isTooNew(data: { schemaVersion?: number }): boolean {
  return schemaOf(data) > CURRENT_SCHEMA_VERSION
}

export function needsMigration(data: { schemaVersion?: number }): boolean {
  return schemaOf(data) < CURRENT_SCHEMA_VERSION
}

export function migrate(
  data: DataFile,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION,
): DataFile {
  let current = data as unknown as Record<string, unknown>
  let v = schemaOf(data)
  while (v < target) {
    const step = migrations[v]
    if (!step) throw new Error(`Keine Migration von Schema ${v} auf ${v + 1}`)
    current = step(current)
    v += 1
    current.schemaVersion = v
  }
  return current as unknown as DataFile
}

/** Pfad der Sicherung vor einer Migration: backups/data-schema<alt>-<JJJJ-MM-TT>.json */
export function backupPath(fromVersion: number, date: string): string {
  return `backups/data-schema${fromVersion}-${date}.json`
}
