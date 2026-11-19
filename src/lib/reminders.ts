// Erinnerungen pro Aufgabe bzw. Termin (Feld reminderTimes): feste Uhrzeiten zum Ankreuzen.
// Wird von der App (Formulare) und von notify (Versand) gleich verwendet.

/**
 * Feste Erinnerungszeiten: "<Tage relativ zum Tag des Eintrags>@HH:MM",
 * z. B. "-7@09:00" = eine Woche vorher um 9 Uhr, "0@12:00" = am Tag selbst um 12 Uhr.
 * Nichts angekreuzt = keine Erinnerung.
 */
export const FIXED_REMINDERS: ReadonlyArray<{ code: string; label: string; group: 'before' | 'day' }> = [
  { code: '-7@09:00', label: '1 Woche vorher, 9 Uhr', group: 'before' },
  { code: '-1@08:00', label: 'Vortag 8 Uhr', group: 'before' },
  { code: '-1@15:00', label: 'Vortag 15 Uhr', group: 'before' },
  { code: '0@09:00', label: '9 Uhr', group: 'day' },
  { code: '0@12:00', label: '12 Uhr', group: 'day' },
  { code: '0@15:00', label: '15 Uhr', group: 'day' },
  { code: '0@18:00', label: '18 Uhr', group: 'day' },
  { code: '0@21:00', label: '21 Uhr', group: 'day' },
]

/** "-1@15:00" → { days: -1, time: "15:00" }; null bei ungültigem Wert */
export function parseFixedReminder(code: string): { days: number; time: string } | null {
  const m = /^(-?\d{1,3})@([01]\d|2[0-3]):([0-5]\d)$/.exec(code)
  return m ? { days: Number(m[1]), time: `${m[2]}:${m[3]}` } : null
}

/** Angekreuzte Zeiten in fester Reihenfolge, ohne Doppelte; leer = undefined (Feld entfällt) */
export function normalizeFixedReminders(codes: string[] | undefined): string[] | undefined {
  if (!codes) return undefined
  const valid = [...new Set(codes)].filter((c) => parseFixedReminder(c))
  const order = (c: string) => {
    const p = parseFixedReminder(c)!
    return p.days * 1440 + Number(p.time.slice(0, 2)) * 60 + Number(p.time.slice(3))
  }
  valid.sort((a, b) => order(a) - order(b))
  return valid.length > 0 ? valid : undefined
}
