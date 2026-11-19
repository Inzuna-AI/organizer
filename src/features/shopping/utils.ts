// Einkaufszettel: reine Logik (Sortierung, Vorschläge, Reihenfolge).
import type { ShoppingItem, ShoppingList } from '@/types/data'

/** Vergleichsschlüssel für Artikelnamen: „ Milch “ = „milch“ */
export function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ')
}

export function sortLists(lists: ShoppingList[]): ShoppingList[] {
  return [...lists].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'de'))
}

/** Offene Artikel in manueller Reihenfolge. */
export function sortOpen(items: ShoppingItem[]): ShoppingItem[] {
  return items.filter((i) => !i.checked).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Erledigte Artikel, zuletzt abgehakter zuerst. */
export function sortChecked(items: ShoppingItem[]): ShoppingItem[] {
  return items
    .filter((i) => i.checked)
    .sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''))
}

/** Nicht gelöschte Artikel einer Liste, aufgeteilt in offen und erledigt. */
export function splitItems(items: ShoppingItem[], listId: string): { open: ShoppingItem[]; checked: ShoppingItem[] } {
  const inList = items.filter((i) => !i.deleted && i.listId === listId)
  return { open: sortOpen(inList), checked: sortChecked(inList) }
}

/** sortOrder für einen Artikel am Ende der offenen Artikel. */
export function nextOpenSortOrder(items: ShoppingItem[], listId: string): number {
  let max = 0
  for (const i of items) if (!i.deleted && !i.checked && i.listId === listId) max = Math.max(max, i.sortOrder)
  return max + 1
}

export type AddPlan =
  | { kind: 'exists'; id: string }
  | { kind: 'reopen'; id: string }
  | { kind: 'create' }

/**
 * Was beim Hinzufügen passiert: Steht der Artikel schon offen auf der Liste, nichts.
 * Ist er abgehakt, wird er wieder geöffnet statt doppelt angelegt. Sonst neu anlegen.
 */
export function planAdd(items: ShoppingItem[], listId: string, name: string): AddPlan {
  const key = nameKey(name)
  const same = items.filter((i) => !i.deleted && i.listId === listId && nameKey(i.name) === key)
  const open = same.find((i) => !i.checked)
  if (open) return { kind: 'exists', id: open.id }
  const checked = sortChecked(same)[0]
  if (checked) return { kind: 'reopen', id: checked.id }
  return { kind: 'create' }
}

export interface Suggestion {
  name: string
  quantity: string
  note: string
  /** Abgehakter Artikel dieser Liste, der wieder geöffnet wird */
  reopenId: string | null
}

/**
 * Vorschläge beim Tippen: aus früheren Artikeln (abgehakt, auch bereits entfernte),
 * ohne die, die gerade offen auf der Liste stehen. Treffer am Wortanfang zuerst.
 */
export function suggest(items: ShoppingItem[], listId: string, query: string, limit = 5): Suggestion[] {
  const q = nameKey(query)
  if (!q) return []
  const openKeys = new Set(
    items.filter((i) => !i.deleted && !i.checked && i.listId === listId).map((i) => nameKey(i.name)),
  )
  const byKey = new Map<string, { s: Suggestion; score: number; when: string }>()
  for (const i of items) {
    const key = nameKey(i.name)
    if (!key || openKeys.has(key) || key === q) continue
    if (!i.deleted && !i.checked) continue
    const pos = key.indexOf(q)
    if (pos < 0) continue
    const wordStart = pos === 0 || key[pos - 1] === ' ' || key[pos - 1] === '-'
    const score = pos === 0 ? 0 : wordStart ? 1 : 2
    const reopen = !i.deleted && i.listId === listId ? i.id : null
    const when = i.checkedAt ?? i.updatedAt
    const prev = byKey.get(key)
    // Wiederöffnen hat Vorrang, sonst der zuletzt verwendete Eintrag
    if (!prev || (reopen && !prev.s.reopenId) || (!!reopen === !!prev.s.reopenId && when > prev.when)) {
      byKey.set(key, { s: { name: i.name.trim(), quantity: i.quantity, note: i.note, reopenId: reopen }, score, when })
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
