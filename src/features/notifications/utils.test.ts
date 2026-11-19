import { describe, expect, it } from 'vitest'
import { NOTIFY_DEFAULTS, reminderPatch, reminderValue, toggleRoom } from './utils'

describe('Benachrichtigungs-Einstellungen', () => {
  it('Erinnerung: Auswahl und Rückweg passen zusammen', () => {
    expect(reminderValue(NOTIFY_DEFAULTS)).toBe('60')
    expect(reminderValue({ ...NOTIFY_DEFAULTS, ...reminderPatch('off') })).toBe('off')
    expect(reminderValue({ ...NOTIFY_DEFAULTS, ...reminderPatch('-1') })).toBe('-1')
    expect(reminderPatch('15')).toEqual({ dueReminder: true, dueReminderMinutesBefore: 15 })
  })

  it('Räume an- und abwählen', () => {
    expect(toggleRoom([], 'a')).toEqual(['a'])
    expect(toggleRoom(['a', 'b'], 'a')).toEqual(['b'])
  })
})
