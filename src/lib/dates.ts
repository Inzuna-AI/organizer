// Datumshelfer: deutsch, Europe/Berlin, TT.MM.JJJJ

export const TIME_ZONE = 'Europe/Berlin'

export function nowIso(): string {
  return new Date().toISOString()
}

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFmt = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

const longFmt = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** 19.11.2026 */
export function formatDate(d: Date | string): string {
  return dateFmt.format(typeof d === 'string' ? new Date(d) : d)
}

/** 19.11.2026, 14:05 */
export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${dateFmt.format(date)}, ${timeFmt.format(date)}`
}

/** Donnerstag, 19. November */
export function formatLongDate(d: Date | string): string {
  return longFmt.format(typeof d === 'string' ? new Date(d) : d)
}

// ---------- Reine Kalenderdaten (JJJJ-MM-TT), ohne Zeitzonen-Effekte ----------

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function parseYmd(date: string): [number, number, number] {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return [y, m, d]
}

/** Tage addieren: addDays('2026-11-30', 1) = '2026-12-01' */
export function addDays(date: string, n: number): string {
  const [y, m, d] = parseYmd(date)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Kurzer Wochentag: Mo, Di … */
export function weekdayShort(date: string): string {
  const [y, m, d] = parseYmd(date)
  return WEEKDAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** '2026-11-19' → '19.11.2026' */
export function formatYmd(date: string): string {
  const [y, m, d] = parseYmd(date)
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

/** Relativer Tag: Heute, Morgen, Gestern, sonst „Mo, 23.11.“ (mit Jahr, wenn anderes Jahr) */
export function formatDay(date: string, today: string = berlinDateString()): string {
  if (date === today) return 'Heute'
  if (date === addDays(today, 1)) return 'Morgen'
  if (date === addDays(today, -1)) return 'Gestern'
  const [y, m, d] = parseYmd(date)
  const base = `${weekdayShort(date)}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`
  return y === parseYmd(today)[0] ? base : `${base}${y}`
}

/** Kalenderdatum in Berlin als JJJJ-MM-TT */
export function berlinDateString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
