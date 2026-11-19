// Helfer für Datensätze: ID erzeugen, Änderungen stempeln, löschen (Tombstone).

import type { BaseRecord } from '@/types/data'
import { nowIso } from './dates'

/** UUID v4. Fällt auf getRandomValues zurück, wenn randomUUID fehlt (z. B. HTTP im WLAN). */
export function uuid(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const b = new Uint8Array(16)
  c.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Basisfelder für einen neuen Datensatz. */
export function newBase(personId: string | null): BaseRecord {
  return {
    id: uuid(),
    updatedAt: nowIso(),
    deleted: false,
    createdBy: personId,
    updatedBy: personId,
  }
}

/** Änderung stempeln: setzt updatedAt und updatedBy. */
export function touch<T extends BaseRecord>(rec: T, personId: string | null, changes: Partial<T> = {}): T {
  return { ...rec, ...changes, updatedAt: nowIso(), updatedBy: personId }
}

/** Löschen als Tombstone. */
export function tombstone<T extends BaseRecord>(rec: T, personId: string | null): T {
  return touch(rec, personId, { deleted: true } as Partial<T>)
}

/** Nur nicht gelöschte Datensätze. */
export function alive<T extends BaseRecord>(list: T[]): T[] {
  return list.filter((r) => !r.deleted)
}
