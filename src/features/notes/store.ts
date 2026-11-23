// Notizen: Daten lesen (Hooks) und ändern (Aktionen).
// Jede Notiz ist ein eigener Datensatz und wird beim Sync einzeln zusammengeführt.
import { useMemo } from 'react'
import type { Note } from '@/types/data'
import { newBase, tombstone, touch, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { sortNotes, type NoteDraft } from './utils'

/** Alle Notizen inkl. gelöschter (z. B. für die Suche filtern Aufrufer selbst) */
export function useAllNotes(): Note[] {
  const notes = useAppStore((s) => s.data?.notes)
  return useMemo(() => notes ?? [], [notes])
}

/** Sichtbare Notizen: angeheftete oben, sonst zuletzt geänderte zuerst */
export function useNotes(): Note[] {
  const notes = useAllNotes()
  return useMemo(() => sortNotes(notes), [notes])
}

export function useNote(id: string | null): Note | null {
  return useAppStore((s) => (id ? (s.data?.notes?.find((n) => n.id === id && !n.deleted) ?? null) : null))
}

export const noteActions = {
  /** Neue Notiz anlegen, gibt ihre id zurück. */
  create(draft: NoteDraft): string {
    const me = currentPersonId()
    const note: Note = { ...newBase(me), ...draft }
    updateData((d) => ({ ...d, notes: [...(d.notes ?? []), note] }))
    return note.id
  },

  /** Felder ändern; unveränderte Werte lösen keinen neuen Zeitstempel aus. */
  save(id: string, changes: Partial<NoteDraft>) {
    const me = currentPersonId()
    updateData((d) => {
      const cur = d.notes.find((n) => n.id === id)
      if (!cur) return d
      const changed = (Object.keys(changes) as Array<keyof NoteDraft>).some(
        (k) => JSON.stringify(cur[k]) !== JSON.stringify(changes[k]),
      )
      return changed ? { ...d, notes: updateById<Note>(d.notes, id, me, changes) } : d
    })
  },

  togglePinned(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, notes: updateById<Note>(d.notes, id, me, (n) => ({ pinned: !n.pinned })) }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? tombstone(n, me) : n)) }))
  },

  /** „Rückgängig“ nach dem Löschen */
  restore(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? touch(n, me, { deleted: false }) : n)) }))
  },
}
