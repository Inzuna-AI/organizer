import { describe, expect, it } from 'vitest'
import {
  backupPath,
  CURRENT_SCHEMA_VERSION,
  isTooNew,
  migrate,
  needsMigration,
} from './migrations'
import { emptyData } from './testdata'

describe('migrations', () => {
  it('erkennt zu neue und zu alte Daten', () => {
    expect(isTooNew({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })).toBe(true)
    expect(isTooNew({ schemaVersion: CURRENT_SCHEMA_VERSION })).toBe(false)
    expect(needsMigration({ schemaVersion: CURRENT_SCHEMA_VERSION })).toBe(false)
  })

  it('wendet Migrationen der Reihe nach an', () => {
    const steps = {
      1: (d: Record<string, unknown>) => ({ ...d, a: true }),
      2: (d: Record<string, unknown>) => ({ ...d, b: true }),
    }
    const out = migrate(emptyData(), steps, 3) as unknown as Record<string, unknown>
    expect(out.schemaVersion).toBe(3)
    expect(out.a).toBe(true)
    expect(out.b).toBe(true)
  })

  it('wirft, wenn ein Migrationsschritt fehlt', () => {
    expect(() => migrate(emptyData(), {}, 2)).toThrow()
  })

  it('baut den Sicherungspfad', () => {
    expect(backupPath(1, '2026-11-19')).toBe('backups/data-schema1-2026-11-19.json')
  })
})
