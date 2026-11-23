// Feiertage (Deutschland, Bremen) plus Adventssonntage, Heiligabend und Silvester.
// Werden nur berechnet, nie in data.json gespeichert.
import { addDays } from './dates'

export interface Holiday {
  /** JJJJ-MM-TT */
  date: string
  name: string
}

/** Bundesland für die Landes-Feiertage */
export const HOLIDAY_REGION = 'HB'

const pad = (n: number) => String(n).padStart(2, '0')

/** Ostersonntag (gregorianisch, Gauß/Anonymer Algorithmus) als JJJJ-MM-TT */
export function easterSunday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${pad(month)}-${pad(day)}`
}

/** 4. Advent = letzter Sonntag vor dem 25. Dezember (fällt Heiligabend auf einen Sonntag, ist es derselbe Tag) */
export function fourthAdvent(year: number): string {
  const weekday = new Date(Date.UTC(year, 11, 24)).getUTCDay() // 0 = Sonntag
  return addDays(`${year}-12-24`, -weekday)
}

/** Alle Feiertage eines Jahres, nach Datum sortiert (gleicher Tag = ein Eintrag, Namen mit „ · “) */
export function holidaysOfYear(year: number): Holiday[] {
  const easter = easterSunday(year)
  const fixed = (m: number, d: number, name: string): Holiday => ({ date: `${year}-${pad(m)}-${pad(d)}`, name })
  const list: Holiday[] = [
    fixed(1, 1, 'Neujahr'),
    { date: addDays(easter, -2), name: 'Karfreitag' },
    { date: addDays(easter, 1), name: 'Ostermontag' },
    fixed(5, 1, 'Tag der Arbeit'),
    { date: addDays(easter, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easter, 50), name: 'Pfingstmontag' },
    fixed(10, 3, 'Tag der Deutschen Einheit'),
    fixed(12, 25, '1. Weihnachtstag'),
    fixed(12, 26, '2. Weihnachtstag'),
  ]
  // Reformationstag: in Bremen seit 2018, 2017 bundesweit (500 Jahre Reformation)
  if (year >= 2017) list.push(fixed(10, 31, 'Reformationstag'))
  // Keine gesetzlichen Feiertage, aber auf Wunsch ebenso markiert
  const advent4 = fourthAdvent(year)
  for (let n = 1; n <= 4; n++) list.push({ date: addDays(advent4, -7 * (4 - n)), name: `${n}. Advent` })
  list.push(fixed(12, 24, 'Heiligabend'), fixed(12, 31, 'Silvester'))

  list.sort((x, y) => x.date.localeCompare(y.date))
  const out: Holiday[] = []
  for (const h of list) {
    const prev = out.at(-1)
    if (prev?.date === h.date) prev.name = `${prev.name} · ${h.name}`
    else out.push({ ...h })
  }
  return out
}

/** Feiertage von bis (JJJJ-MM-TT, beide inklusive) */
export function holidaysBetween(from: string, to: string): Holiday[] {
  if (!from || !to || from > to) return []
  const out: Holiday[] = []
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const h of holidaysOfYear(y)) if (h.date >= from && h.date <= to) out.push(h)
  }
  return out
}

/** Feiertag an einem Tag oder null */
export function holidayOn(date: string): Holiday | null {
  return holidaysOfYear(Number(date.slice(0, 4))).find((h) => h.date === date) ?? null
}
