// Notizen: reine Logik (Sortierung, Vorschau, leere Zettel).
import type { ChecklistItem, Note } from '@/types/data'

/** Inhalt, den man im Editor bearbeitet */
export interface NoteDraft {
  title: string
  text: string
  checklist: ChecklistItem[]
  color: string | null
  pinned: boolean
}

export const EMPTY_DRAFT: NoteDraft = { title: '', text: '', checklist: [], color: null, pinned: false }

/** Angeheftete zuerst, sonst zuletzt geänderte oben. */
export function sortNotes(notes: Note[]): Note[] {
  return notes
    .filter((n) => !n.deleted)
    .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1))
}

/** Kein Titel, kein Text, keine Punkte → Zettel wird nicht angelegt bzw. verworfen. */
export function isEmptyNote(n: Pick<NoteDraft, 'title' | 'text' | 'checklist'>): boolean {
  return !n.title.trim() && !n.text.trim() && n.checklist.every((i) => !i.title.trim())
}

/** Überschrift auf der Kachel: Titel, sonst erste Textzeile, sonst erster Punkt. */
export function noteHeading(n: Pick<NoteDraft, 'title' | 'text' | 'checklist'>): string {
  const firstLine = n.text.split('\n').find((l) => l.trim())?.trim()
  return n.title.trim() || firstLine || n.checklist.find((i) => i.title.trim())?.title.trim() || 'Leere Notiz'
}

/** Text unter der Überschrift (ohne die Zeile, die schon als Überschrift dient). */
export function notePreview(n: Pick<NoteDraft, 'title' | 'text'>, maxChars = 160): string {
  let lines = n.text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!n.title.trim()) lines = lines.slice(1)
  const s = lines.join('\n')
  return s.length > maxChars ? `${s.slice(0, maxChars).trimEnd()} …` : s
}

/** „3/5“ für Zettel mit Punkten, sonst null */
export function checklistProgress(items: ChecklistItem[]): string | null {
  const real = items.filter((i) => i.title.trim())
  return real.length ? `${real.filter((i) => i.done).length}/${real.length}` : null
}

/** Leere Punkte (z. B. versehentlich angelegt) nicht speichern */
export function cleanChecklist(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => i.title.trim())
}
