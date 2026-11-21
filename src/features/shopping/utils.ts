// Einkaufszettel: reine Logik (Sortierung, Vorschläge, Reihenfolge).
import type { ShoppingItem, ShoppingList } from '@/types/data'

/** Vergleichsschlüssel für Artikelnamen: „ Milch “ = „milch“ */
export function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ')
}

export function sortLists(lists: ShoppingList[]): ShoppingList[] {
  return [...lists].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'de'))
}

/** Offene Artikel (aktuelle Liste) in manueller Reihenfolge. */
export function sortOpen(items: ShoppingItem[]): ShoppingItem[] {
  return items.filter((i) => !i.checked && !i.later).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** „Nächster Einkauf“: zurückgestellte Artikel in der Reihenfolge, in der sie dazukamen. */
export function sortLater(items: ShoppingItem[]): ShoppingItem[] {
  return items.filter((i) => !i.checked && i.later).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Erledigte Artikel, zuletzt abgehakter zuerst. */
export function sortChecked(items: ShoppingItem[]): ShoppingItem[] {
  return items.filter((i) => i.checked).sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''))
}

export interface ListItems {
  open: ShoppingItem[]
  later: ShoppingItem[]
  checked: ShoppingItem[]
}

/** Nicht gelöschte Artikel einer Liste, aufgeteilt in offen, „Nächster Einkauf“ und erledigt. */
export function splitItems(items: ShoppingItem[], listId: string): ListItems {
  const inList = items.filter((i) => !i.deleted && i.listId === listId)
  return { open: sortOpen(inList), later: sortLater(inList), checked: sortChecked(inList) }
}

/** sortOrder für einen Artikel am Ende der offenen Artikel (bzw. von „Nächster Einkauf“). */
export function nextOpenSortOrder(items: ShoppingItem[], listId: string, later = false): number {
  let max = 0
  for (const i of items) {
    if (!i.deleted && !i.checked && !!i.later === later && i.listId === listId) max = Math.max(max, i.sortOrder)
  }
  return max + 1
}

export type AddPlan = { kind: 'exists'; id: string } | { kind: 'reopen'; id: string } | { kind: 'create' }

/**
 * Was beim Hinzufügen passiert: Steht der Artikel schon offen auf der Liste, nichts.
 * Liegt er unter „Nächster Einkauf“, wird er auf die aktuelle Liste geholt (bzw. bleibt dort, wenn er
 * ebenfalls für später gedacht ist). Ist er abgehakt, wird er wieder geöffnet statt doppelt angelegt.
 * Sonst neu anlegen.
 */
export function planAdd(items: ShoppingItem[], listId: string, name: string, later = false): AddPlan {
  const key = nameKey(name)
  const same = items.filter((i) => !i.deleted && i.listId === listId && nameKey(i.name) === key)
  const open = same.find((i) => !i.checked && !i.later)
  if (open) return { kind: 'exists', id: open.id }
  const waiting = same.find((i) => !i.checked && i.later)
  if (waiting) return later ? { kind: 'exists', id: waiting.id } : { kind: 'reopen', id: waiting.id }
  const checked = sortChecked(same)[0]
  if (checked) return { kind: 'reopen', id: checked.id }
  return { kind: 'create' }
}

export interface Suggestion {
  name: string
  quantity: string
  note: string
  /** Abgehakter Artikel dieser Liste, der wieder geöffnet wird (bzw. aus „Nächster Einkauf“ geholt) */
  reopenId: string | null
  /** Liegt unter „Nächster Einkauf“ */
  later: boolean
}

/**
 * Vorschläge beim Tippen: aus früheren Artikeln (abgehakt, auch bereits entfernte),
 * ohne die, die gerade offen auf der Liste stehen. Treffer am Wortanfang zuerst.
 */
export function suggest(items: ShoppingItem[], listId: string, query: string, limit = 5): Suggestion[] {
  const q = nameKey(query)
  if (!q) return []
  const openKeys = new Set(
    items.filter((i) => !i.deleted && !i.checked && !i.later && i.listId === listId).map((i) => nameKey(i.name)),
  )
  const byKey = new Map<string, { s: Suggestion; score: number; when: string }>()
  for (const i of items) {
    const key = nameKey(i.name)
    if (!key || openKeys.has(key) || key === q) continue
    if (!i.deleted && !i.checked && !i.later) continue
    const pos = key.indexOf(q)
    if (pos < 0) continue
    const wordStart = pos === 0 || key[pos - 1] === ' ' || key[pos - 1] === '-'
    const score = pos === 0 ? 0 : wordStart ? 1 : 2
    const reopen = !i.deleted && i.listId === listId ? i.id : null
    const later = !!reopen && !i.checked && !!i.later
    const when = i.checkedAt ?? i.updatedAt
    const prev = byKey.get(key)
    // „Nächster Einkauf“ vor Wiederöffnen, das vor neuem Eintrag, sonst der zuletzt verwendete
    const rank = (x: { reopenId: string | null; later: boolean }) => (x.later ? 2 : x.reopenId ? 1 : 0)
    const mine = rank({ reopenId: reopen, later })
    if (!prev || mine > rank(prev.s) || (mine === rank(prev.s) && when > prev.when)) {
      byKey.set(key, {
        s: { name: i.name.trim(), quantity: i.quantity, note: i.note, reopenId: reopen, later },
        score,
        when,
      })
    }
  }
  return [...byKey.values()]
    .sort((a, b) => a.score - b.score || b.when.localeCompare(a.when))
    .slice(0, limit)
    .map((x) => x.s)
}

/** Neue Reihenfolge der offenen Artikel → nur geänderte sortOrder-Werte (1..n). */
export function reorderChanges(open: ShoppingItem[], orderedIds: string[]): Map<string, number> {
  const current = new Map(open.map((i) => [i.id, i.sortOrder]))
  const changes = new Map<string, number>()
  orderedIds.forEach((id, idx) => {
    if (current.has(id) && current.get(id) !== idx + 1) changes.set(id, idx + 1)
  })
  return changes
}
