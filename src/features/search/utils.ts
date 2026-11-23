// Suche über alle Aufgaben, Termine und Notizen: reine Logik.
import type { CalEvent, Note, Task } from '@/types/data'
import { addDays } from '@/lib/dates'
import { compareInstances, eventsBetween, type EventInstance } from '@/lib/events'
import type { TaskInstance } from '@/features/tasks'

/** Kleinbuchstaben, ohne Akzente/Umlaut-Punkte, ß → ss: „Küche“ findet man auch mit „kuche“. */
export function normalize(s: string): string {
  return s
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Durchsuchbarer Text einer Aufgabe: Titel, Beschreibung, Checkliste, Raum */
export function haystack(t: Task, roomName: string | undefined): string {
  return normalize([t.title, t.description, ...t.checklist.map((i) => i.title), roomName ?? ''].join('\n'))
}

/** Alle Wörter der Suche müssen vorkommen (in beliebiger Reihenfolge). */
export function matches(text: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return words.length > 0 && words.every((w) => text.includes(w))
}

/** Durchsuchbarer Text eines Termins: Titel, Ort, Notiz */
export function eventHaystack(e: CalEvent): string {
  return normalize([e.title, e.location, e.note].join('\n'))
}

/**
 * Pro Termin ein Treffer: der nächste ab heute, sonst der letzte vergangene.
 * Nach Beginn sortiert, kommende zuerst.
 */
export function searchEvents(events: CalEvent[], query: string, today: string, limit = 50): { upcoming: EventInstance[]; past: EventInstance[] } {
  const upcoming: EventInstance[] = []
  const past: EventInstance[] = []
  for (const e of events) {
    if (e.deleted || !e.startAt || !matches(eventHaystack(e), query)) continue
    const next = eventsBetween([e], today, addDays(today, 400))[0]
    if (next) {
      upcoming.push(next)
      continue
    }
    const from = e.recurrenceRule ? addDays(today, -400) : e.startAt.slice(0, 10)
    const last = eventsBetween([e], from, today).at(-1)
    if (last) past.push(last)
  }
  upcoming.sort(compareInstances)
  past.sort((a, b) => compareInstances(b, a))
  return { upcoming: upcoming.slice(0, limit), past: past.slice(0, limit) }
}

/** Durchsuchbarer Text einer Notiz: Titel, Text, Punkte */
export function noteHaystack(n: Note): string {
  return normalize([n.title, n.text, ...n.checklist.map((i) => i.title)].join('\n'))
}

/** Passende Notizen: angeheftete zuerst, sonst zuletzt geänderte oben */
export function searchNotes(notes: Note[], query: string, limit = 50): Note[] {
  return notes
    .filter((n) => !n.deleted && matches(noteHaystack(n), query))
    .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1))
    .slice(0, limit)
}

export interface SearchResult {
  open: TaskInstance[]
  done: TaskInstance[]
}

/**
 * Pro Aufgabe ein Treffer. Bei Serien der nächste offene Termin, sonst der zuletzt erledigte.
 * Aufgaben ohne passenden Termin (z. B. beendete Serie) erscheinen als Serie selbst.
 */
export function searchTasks(
  tasks: Task[],
  instances: TaskInstance[],
  query: string,
  roomName: (id: string | null) => string | undefined,
  limit = 50,
): SearchResult {
  const byTask = new Map<string, TaskInstance[]>()
  for (const i of instances) {
    if (!byTask.has(i.id)) byTask.set(i.id, [])
    byTask.get(i.id)!.push(i)
  }

  const open: TaskInstance[] = []
  const done: TaskInstance[] = []
  for (const t of tasks) {
    if (t.deleted || !matches(haystack(t, roomName(t.roomId)), query)) continue
    const list = byTask.get(t.id) ?? []
    const firstOpen = list
      .filter((i) => i.status === 'open')
      .sort((a, b) => (a.startAt ?? '9999').localeCompare(b.startAt ?? '9999'))[0]
    const lastDone = list
      .filter((i) => i.status === 'done')
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0]
    const pick = firstOpen ?? lastDone ?? t
    ;(pick.status === 'done' ? done : open).push(pick)
  }

  open.sort((a, b) => {
    // Inbox (ohne Datum) ans Ende, sonst nach Datum
    const da = a.startAt ?? '9999'
    const db = b.startAt ?? '9999'
    return da === db ? a.title.localeCompare(b.title, 'de') : da < db ? -1 : 1
  })
  done.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  return { open: open.slice(0, limit), done: done.slice(0, limit) }
}
