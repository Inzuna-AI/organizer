import { describe, expect, it } from 'vitest'
import { NOTIFY_DEFAULTS, toggleRoom } from './utils'

describe('Benachrichtigungs-Einstellungen', () => {
  it('Erinnerungen sind für neue Geräte eingeschaltet', () => {
    expect(NOTIFY_DEFAULTS.dueReminder).toBe(true)
  })

  it('Räume an- und abwählen', () => {
    expect(toggleRoom([], 'a')).toEqual(['a'])
    expect(toggleRoom(['a', 'b'], 'a')).toEqual(['b'])
  })
})
