// Stundenplan: Daten lesen (Hook) und ändern (Aktion).
// Jedes Feld ist ein eigener Datensatz und wird beim Sync einzeln zusammengeführt.
import { useMemo } from 'react'
import type { TimetableCell } from '@/types/data'
import { newBase, tombstone, touch } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { cellId, cellTexts, defaultText, isShared, type TimetableColumn } from './utils'

/** Gespeicherte Texte nach Feld-id */
export function useTimetableTexts(): Map<string, string> {
  const cells = useAppStore((s) => s.data?.timetable)
  return useMemo(() => cellTexts(cells ?? []), [cells])
}

export function setCell(
  cells: TimetableCell[],
  day: number,
  row: number,
  column: TimetableColumn,
  text: string,
  me: string | null,
): TimetableCell[] {
  const shared = isShared(row, column)
  const id = cellId(shared ? null : day, row, column)
  const value = text.trim()
  const cur = cells.find((c) => c.id === id)
  // Leer oder wie voreingestellt → Feld zurücksetzen (Tombstone)
  if (!value || value === defaultText(row, column)) {
    return cur && !cur.deleted ? cells.map((c) => (c.id === id ? tombstone(c, me) : c)) : cells
  }
  if (!cur) return [...cells, { ...newBase(me), id, day: shared ? null : day, row, column, text: value }]
  if (!cur.deleted && cur.text === value) return cells
  return cells.map((c) => (c.id === id ? touch(c, me, { text: value, deleted: false }) : c))
}

export const timetableActions = {
  set(day: number, row: number, column: TimetableColumn, text: string) {
    const me = currentPersonId()
    updateData((d) => {
      const timetable = setCell(d.timetable ?? [], day, row, column, text, me)
      return timetable === d.timetable ? d : { ...d, timetable }
    })
  },
}
