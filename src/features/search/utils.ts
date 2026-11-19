// Suche über alle Aufgaben: reine Logik.
import type { Task } from '@/types/data'
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
