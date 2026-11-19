import { describe, expect, it } from 'vitest'
import { normalizeReminder, reminderFromValue, reminderLabel, reminderOptions, reminderToValue } from './reminders'

describe('Erinnerung pro Eintrag', () => {
  it('Select-Werte hin und zurück', () => {
    for (const v of [undefined, null, 0, 15, 1440]) expect(reminderFromValue(reminderToValue(v))).toBe(v)
  })

  it('Beschriftungen', () => {
    expect(reminderLabel(0, false)).toBe('Zum Zeitpunkt')
    expect(reminderLabel(5, false)).toBe('5 Minuten vorher')
    expect(reminderLabel(60, false)).toBe('1 Stunde vorher')
    expect(reminderLabel(1440, false)).toBe('1 Tag vorher')
    expect(reminderLabel(0, true)).toBe('Am Morgen des Tages')
    expect(reminderLabel(1440, true)).toBe('Am Vortag (morgens)')
  })

  it('ganztägig: Minuten werden zu „am Morgen“, Tage bleiben', () => {
    expect(normalizeReminder(15, true)).toBe(0)
    expect(normalizeReminder(1440, true)).toBe(1440)
    expect(normalizeReminder(15, false)).toBe(15)
    expect(normalizeReminder(undefined, true)).toBeUndefined()
    expect(normalizeReminder(null, true)).toBeNull()
  })

  it('abweichender Wert bleibt wählbar', () => {
    const values = reminderOptions(false, 120).map((o) => o.value)
    expect(values).toEqual(['default', 'none', '0', '5', '15', '30', '60', '120', '1440'])
    expect(reminderOptions(true, undefined).map((o) => o.value)).toEqual(['default', 'none', '0', '1440'])
  })
})
