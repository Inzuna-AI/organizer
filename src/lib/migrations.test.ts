import { describe, expect, it } from 'vitest'
import {
  backupPath,
  CURRENT_SCHEMA_VERSION,
  isTooNew,
  migrate,
  MIGRATIONS,
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
    const out = migrate({ ...emptyData(), schemaVersion: 1 }, steps, 3) as unknown as Record<string, unknown>
    expect(out.schemaVersion).toBe(3)
    expect(out.a).toBe(true)
    expect(out.b).toBe(true)
  })

  it('wirft, wenn ein Migrationsschritt fehlt', () => {
    expect(() => migrate({ ...emptyData(), schemaVersion: 1 }, {}, 2)).toThrow()
  })

  it('Schema 1 → 2: Termine und Einstellung „neuer Termin“', () => {
    const v1 = { ...emptyData(), schemaVersion: 1, devices: [{ id: 'd', notify: { newTask: true } }] } as unknown as Record<string, unknown>
    delete v1.events
    const out = migrate(v1 as never, MIGRATIONS, 2) as unknown as Record<string, unknown>
    expect(out.schemaVersion).toBe(2)
    expect(out.events).toEqual([])
    expect((out.devices as Array<{ notify: { newEvent: boolean } }>)[0].notify.newEvent).toBe(true)
  })

  it('baut den Sicherungspfad', () => {
    expect(backupPath(1, '2026-11-19')).toBe('backups/data-schema1-2026-11-19.json')
  })
})
