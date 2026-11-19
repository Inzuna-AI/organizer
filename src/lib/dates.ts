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
