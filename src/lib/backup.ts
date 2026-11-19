// Export/Import von data.json als zusätzliche Sicherung (neben der Git-Historie des Daten-Repos).
import { COLLECTIONS, type BaseRecord, type DataFile } from '@/types/data'
import { mergeData, normalizeData, serializeData } from './merge'
import { isTooNew, migrate, needsMigration } from './migrations'

export function backupFileName(date: string): string {
  return `organizer-backup-${date}.json`
}

export function exportText(data: DataFile): string {
  return serializeData(data)
}

export type ParseResult = { ok: true; data: DataFile } | { ok: false; error: string }

function isRecord(r: unknown): r is BaseRecord {
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof (r as BaseRecord).id === 'string' &&
    typeof (r as BaseRecord).updatedAt === 'string'
  )
}

/** Liest eine Sicherungsdatei und prüft sie, bevor irgendetwas übernommen wird. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Die Datei sieht nicht wie eine Organizer-Sicherung aus.' }
  }
  const obj = raw as Record<string, unknown>
  const known = COLLECTIONS.filter((k) => Array.isArray(obj[k]))
  if (known.length === 0) {
    return { ok: false, error: 'Die Datei sieht nicht wie eine Organizer-Sicherung aus.' }
  }
  for (const k of known) {
    if (!(obj[k] as unknown[]).every(isRecord)) {
      return { ok: false, error: `Die Datei ist beschädigt (ungültige Einträge in „${k}“).` }
    }
  }
  if (isTooNew(obj as { schemaVersion?: number })) {
    return {
      ok: false,
      error: 'Die Sicherung stammt von einer neueren App-Version. Bitte zuerst die App aktualisieren.',
    }
  }
  let data = normalizeData(obj as Partial<DataFile>)
  if (needsMigration(data)) data = migrate(data)
  return { ok: true, data }
}

/** Kurze Beschreibung für die Rückfrage, z. B. „12 Aufgaben, 5 Räume …“ */
export function describeBackup(data: DataFile): string {
  const n = (list: BaseRecord[]) => list.filter((r) => !r.deleted).length
  return [
    `${n(data.tasks)} Aufgaben`,
    `${n(data.rooms)} Räume`,
    `${n(data.persons)} Personen`,
    `${n(data.shoppingItems)} Einkaufsartikel`,
  ].join(', ')
}

/**
 * Zusammenführen: pro Datensatz gewinnt der neuere Stand (wie beim Sync).
 * Geräte (Push-Anmeldungen) bleiben wie sie sind.
 */
export function mergeImport(current: DataFile, backup: DataFile): DataFile {
  return { ...mergeData(current, backup), devices: current.devices }
}

/**
 * Wiederherstellen: Der Stand der Sicherung wird wieder der aktuelle.
 * Datensätze der Sicherung bekommen einen neuen Zeitstempel (damit sie beim Sync gewinnen),
 * alles, was es in der Sicherung nicht gibt, wird gelöscht (Tombstone). Geräte bleiben unverändert.
 */
export function restoreImport(current: DataFile, backup: DataFile, personId: string | null, now: string): DataFile {
  const out = { ...current }
  for (const key of COLLECTIONS) {
    if (key === 'devices') continue
    const fromBackup = (backup[key] ?? []) as BaseRecord[]
    const ids = new Set(fromBackup.map((r) => r.id))
    const restored = fromBackup.map((r) => ({ ...r, updatedAt: now, updatedBy: personId }))
    const rest = ((current[key] ?? []) as BaseRecord[])
      .filter((r) => !ids.has(r.id))
      .map((r) => (r.deleted ? r : { ...r, deleted: true, updatedAt: now, updatedBy: personId }))
    ;(out as unknown as Record<string, BaseRecord[]>)[key] = [...restored, ...rest]
  }
  return out
}
