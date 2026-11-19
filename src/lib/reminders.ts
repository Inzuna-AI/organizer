// Erinnerung pro Aufgabe bzw. Termin (Feld reminderMin): Bedeutung und Beschriftung.
// Wird von der App (Formulare) und von notify (Versand) gleich verwendet.

/**
 * undefined = Standard des Geräts (Einstellungen → Benachrichtigungen), null = keine Erinnerung,
 * 0 = zum Zeitpunkt, N = N Minuten vorher.
 * Ganztägig: unter 1440 = am Morgen des Tages, ab 1440 = so viele Tage vorher am Morgen.
 */
export type ReminderMin = number | null | undefined

/** Auswahl für Einträge mit Uhrzeit */
export const TIMED_REMINDERS = [0, 5, 15, 30, 60, 1440] as const
/** Auswahl für ganztägige Einträge */
export const ALL_DAY_REMINDERS = [0, 1440] as const

/** Ganztägig: 15 Minuten vorher heißt „am Morgen“, 1 Tag vorher „am Vortag“ */
export function normalizeReminder(min: ReminderMin, allDay: boolean): ReminderMin {
  if (!allDay || min == null) return min
  return min >= 1440 ? Math.floor(min / 1440) * 1440 : 0
}

export function reminderLabel(min: number, allDay: boolean): string {
  if (allDay) {
    if (min < 1440) return 'Am Morgen des Tages'
    const days = Math.floor(min / 1440)
    return days === 1 ? 'Am Vortag (morgens)' : `${days} Tage vorher (morgens)`
  }
  if (min === 0) return 'Zum Zeitpunkt'
  if (min % 1440 === 0) return min === 1440 ? '1 Tag vorher' : `${min / 1440} Tage vorher`
  if (min % 60 === 0) return min === 60 ? '1 Stunde vorher' : `${min / 60} Stunden vorher`
  return `${min} Minuten vorher`
}

/** Wert eines <select>: „default“, „none“ oder die Minuten */
export function reminderToValue(min: ReminderMin): string {
  return min === undefined ? 'default' : min === null ? 'none' : String(min)
}

export function reminderFromValue(value: string): ReminderMin {
  return value === 'default' ? undefined : value === 'none' ? null : Number(value)
}

/** Optionen fürs Formular; ein abweichender gespeicherter Wert bleibt wählbar */
export function reminderOptions(allDay: boolean, current: ReminderMin): Array<{ value: string; label: string }> {
  const mins: number[] = [...(allDay ? ALL_DAY_REMINDERS : TIMED_REMINDERS)]
  const cur = normalizeReminder(current, allDay)
  if (typeof cur === 'number' && !mins.includes(cur)) mins.push(cur)
  mins.sort((a, b) => a - b)
  return [
    { value: 'default', label: 'Standard (laut Einstellungen)' },
    { value: 'none', label: 'Keine' },
    ...mins.map((m) => ({ value: String(m), label: reminderLabel(m, allDay) })),
  ]
}
