// Stundenplan: reine Logik (Felder, Voreinstellungen, Wochentag).
import type { TimetableCell } from '@/types/data'

export type TimetableColumn = TimetableCell['column']

/** Montag bis Freitag */
export const DAYS = [
  { day: 1, label: 'Mo' },
  { day: 2, label: 'Di' },
  { day: 3, label: 'Mi' },
  { day: 4, label: 'Do' },
  { day: 5, label: 'Fr' },
] as const

/** 9 Zeilen ab 8 Uhr, je eine Stunde */
export const ROW_COUNT = 9
export const FIRST_HOUR = 8
export const ROWS = Array.from({ length: ROW_COUNT }, (_, i) => i)
/** Zeile der Spaltenköpfe */
export const HEADER_ROW = -1

/** Voreingestellte Spaltenköpfe (nur Text, ohne Personenbezug) */
export const DEFAULT_HEADERS: Record<'a' | 'b', string> = { a: 'Lena', b: 'Christoph' }

/** Deterministische id: beide Geräte schreiben für dasselbe Feld denselben Datensatz */
export function cellId(day: number | null, row: number, column: TimetableColumn): string {
  return `stundenplan:${day ?? 'alle'}:${row === HEADER_ROW ? 'kopf' : row}:${column}`
}

/** Voreinstellung eines Feldes: Uhrzeit „08:00“ … „16:00“, Spaltenkopf, sonst leer */
export function defaultText(row: number, column: TimetableColumn): string {
  if (column === 'time') return row === HEADER_ROW ? '' : `${String(FIRST_HOUR + row).padStart(2, '0')}:00`
  return row === HEADER_ROW ? DEFAULT_HEADERS[column] : ''
}

/** Uhrzeiten und Spaltenköpfe gelten für alle Tage */
export function isShared(row: number, column: TimetableColumn): boolean {
  return column === 'time' || row === HEADER_ROW
}

/** Gespeicherter Text der nicht gelöschten Felder nach id */
export function cellTexts(cells: TimetableCell[]): Map<string, string> {
  const out = new Map<string, string>()
  for (const c of cells) if (!c.deleted) out.set(c.id, c.text)
  return out
}

/** Angezeigter Text: gespeichert oder Voreinstellung */
export function cellText(texts: Map<string, string>, day: number, row: number, column: TimetableColumn): string {
  const id = cellId(isShared(row, column) ? null : day, row, column)
  return texts.get(id) ?? defaultText(row, column)
}

/** Wochentag zum Datum (JJJJ-MM-TT); am Wochenende Montag */
export function defaultDay(date: string): number {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay()
  return d >= 1 && d <= 5 ? d : 1
}
