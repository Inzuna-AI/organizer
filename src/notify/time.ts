// Zeit in Europe/Berlin, unabhängig von der Zeitzone des Rechners (GitHub Actions läuft in UTC).
import { TIME_ZONE } from '@/lib/dates'

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Datum (JJJJ-MM-TT) und Uhrzeit (HH:MM) in Berlin */
export function berlinParts(d: Date): { date: string; time: string } {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

/** Abstand Berlin zu UTC in Millisekunden zum Zeitpunkt ms */
function offsetAt(ms: number): number {
  const { date, time } = berlinParts(new Date(ms))
  const [y, m, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return Date.UTC(y, m - 1, d, h, mi) - Math.floor(ms / 60_000) * 60_000
}

/** Berliner Wandzeit („2026-11-20T10:00“ oder „2026-11-20“ = 00:00) → echter Zeitpunkt */
export function berlinWallToDate(wall: string): Date {
  const [y, m, d] = wall.slice(0, 10).split('-').map(Number)
  const [h, mi] = wall.length >= 16 ? wall.slice(11, 16).split(':').map(Number) : [0, 0]
  const asUtc = Date.UTC(y, m - 1, d, h, mi)
  const first = asUtc - offsetAt(asUtc)
  return new Date(asUtc - offsetAt(first))
}

/** „HH:MM“ → Minuten seit Mitternacht */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Liegt die Uhrzeit in den Ruhezeiten? (auch über Mitternacht, z. B. 22:00–07:00) */
export function inQuietHours(time: string, quiet: { from: string; to: string } | null): boolean {
  if (!quiet || quiet.from === quiet.to) return false
  const t = minutesOf(time)
  const from = minutesOf(quiet.from)
  const to = minutesOf(quiet.to)
  return from < to ? t >= from && t < to : t >= from || t < to
}
