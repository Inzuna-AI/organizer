import { describe, expect, it } from 'vitest'
import { FIXED_REMINDERS, normalizeFixedReminders, parseFixedReminder } from './reminders'

describe('Erinnerungen zu festen Uhrzeiten', () => {
  it('alle Auswahl-Werte sind gültig', () => {
    expect(FIXED_REMINDERS).toHaveLength(8)
    for (const r of FIXED_REMINDERS) expect(parseFixedReminder(r.code)).not.toBeNull()
  })

  it('lesen und ordnen', () => {
    expect(parseFixedReminder('-1@15:00')).toEqual({ days: -1, time: '15:00' })
    expect(parseFixedReminder('0@24:00')).toBeNull()
    expect(parseFixedReminder('quatsch')).toBeNull()
    expect(normalizeFixedReminders(['0@21:00', '-7@09:00', '0@21:00', 'x', '-1@08:00'])).toEqual(['-7@09:00', '-1@08:00', '0@21:00'])
    expect(normalizeFixedReminders([])).toBeUndefined()
  })
})
