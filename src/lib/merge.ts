// Zusammenführen von lokalem und entferntem Stand.
// Regel: pro Datensatz (id) gewinnt der neuere updatedAt. Tombstones bleiben erhalten.

import { COLLECTIONS, type BaseRecord, type DataFile } from '@/types/data'

export const TOMBSTONE_MAX_AGE_DAYS = 30

function time(iso: string | undefined): number {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isNaN(t) ? 0 : t
}

/** Wählt die gültige Version eines Datensatzes. Bei Gleichstand gewinnt die Löschung, sonst remote. */
export function pickNewer<T extends BaseRecord>(local: T, remote: T): T {
  const tl = time(local.updatedAt)
  const tr = time(remote.updatedAt)
  if (tl > tr) return local
  if (tr > tl) return remote
  if (local.deleted !== remote.deleted) return local.deleted ? local : remote
  return remote
}

/** Führt zwei Listen zusammen. Reihenfolge: remote zuerst, danach nur lokal vorhandene. */
export function mergeRecords<T extends BaseRecord>(local: T[] = [], remote: T[] = []): T[] {
  const localById = new Map(local.map((r) => [r.id, r]))
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of remote) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    const l = localById.get(r.id)
    out.push(l ? pickNewer(l, r) : r)
  }
  for (const l of local) {
    if (seen.has(l.id)) continue
    seen.add(l.id)
    out.push(l)
  }
  return out
}

export function mergeData(local: DataFile, remote: DataFile): DataFile {
  const out = {
    ...local,
    ...remote,
    schemaVersion: Math.max(local.schemaVersion ?? 1, remote.schemaVersion ?? 1),
  } as DataFile
  for (const key of COLLECTIONS) {
    ;(out as unknown as Record<string, BaseRecord[]>)[key] = mergeRecords<BaseRecord>(
      local[key] as BaseRecord[] | undefined,
      remote[key] as BaseRecord[] | undefined,
    )
  }
  return out
}

/** Entfernt Tombstones, die älter als maxAgeDays sind. */
export function pruneTombstones(
  data: DataFile,
  now: number = Date.now(),
  maxAgeDays: number = TOMBSTONE_MAX_AGE_DAYS,
): DataFile {
  const limit = now - maxAgeDays * 24 * 60 * 60 * 1000
  const out = { ...data }
  for (const key of COLLECTIONS) {
    const list = (data[key] ?? []) as BaseRecord[]
    ;(out as unknown as Record<string, BaseRecord[]>)[key] = list.filter(
      (r) => !(r.deleted && time(r.updatedAt) < limit),
    )
  }
  return out
}

/** Ergänzt fehlende Sammlungen (z. B. bei einer von Hand angelegten Datei). */
export function normalizeData(raw: Partial<DataFile> & { schemaVersion?: number }): DataFile {
  const out = { ...raw, schemaVersion: raw.schemaVersion ?? 1 } as DataFile
  for (const key of COLLECTIONS) {
    if (!Array.isArray(out[key])) (out as unknown as Record<string, unknown[]>)[key] = []
  }
  return out
}

export function serializeData(data: DataFile): string {
  return JSON.stringify(data, null, 2) + '\n'
}
