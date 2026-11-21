// Einkaufszettel: Daten lesen (Hooks) und ändern (Aktionen).
// Jeder Artikel ist ein eigener Datensatz und wird beim Sync einzeln zusammengeführt.
import { useMemo } from 'react'
import type { DataFile, ShoppingItem, ShoppingList } from '@/types/data'
import { nowIso } from '@/lib/dates'
import { alive, newBase, tombstone, touch, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { nextOpenSortOrder, planAdd, reorderChanges, sortLists, splitItems } from './utils'

export function useShoppingLists(): ShoppingList[] {
  const lists = useAppStore((s) => s.data?.shoppingLists)
  return useMemo(() => sortLists(alive(lists ?? [])), [lists])
}

/** Alle Artikel inkl. gelöschter (für Vorschläge). */
export function useAllShoppingItems(): ShoppingItem[] {
  const items = useAppStore((s) => s.data?.shoppingItems)
  return useMemo(() => items ?? [], [items])
}

export function useListItems(listId: string | null) {
  const items = useAllShoppingItems()
  return useMemo(() => (listId ? splitItems(items, listId) : { open: [], later: [], checked: [] }), [items, listId])
}

export interface ItemInput {
  name: string
  quantity?: string
  note?: string
}

/** Liste „Einkauf“ anlegen, falls es noch keine gibt. Gibt Daten und Listen-id zurück. */
function ensureList(d: DataFile, listId: string | null, me: string | null): { d: DataFile; listId: string } {
  if (listId && d.shoppingLists.some((l) => l.id === listId && !l.deleted)) return { d, listId }
  const first = sortLists(alive(d.shoppingLists))[0]
  if (first) return { d, listId: first.id }
  const list: ShoppingList = { ...newBase(me), name: 'Einkauf', sortOrder: 1 }
  return { d: { ...d, shoppingLists: [...d.shoppingLists, list] }, listId: list.id }
}

export const shoppingActions = {
  /**
   * Artikel hinzufügen. Ist er abgehakt oder liegt er unter „Nächster Einkauf“, wird er wieder
   * geöffnet (ans Ende), steht er schon offen auf der Liste, passiert nichts.
   * `later` = direkt unter „Nächster Einkauf“ ablegen.
   */
  add(listId: string | null, input: ItemInput, reopenId: string | null = null, later = false) {
    const me = currentPersonId()
    const name = input.name.trim()
    if (!name) return
    updateData((data) => {
      const { d, listId: lid } = ensureList(data, listId, me)
      const plan = reopenId ? { kind: 'reopen' as const, id: reopenId } : planAdd(d.shoppingItems, lid, name, later)
      if (plan.kind === 'exists') return d
      const sortOrder = nextOpenSortOrder(d.shoppingItems, lid, later)
      if (plan.kind === 'reopen') {
        return {
          ...d,
          shoppingItems: updateById(d.shoppingItems, plan.id, me, (i) => ({
            checked: false,
            checkedAt: null,
            later,
            sortOrder,
            quantity: input.quantity?.trim() || i.quantity,
            note: input.note?.trim() || i.note,
          })),
        }
      }
      const item: ShoppingItem = {
        ...newBase(me),
        listId: lid,
        name,
        quantity: input.quantity?.trim() ?? '',
        note: input.note?.trim() ?? '',
        checked: false,
        checkedAt: null,
        sortOrder,
        ...(later ? { later: true } : {}),
      }
      return { ...d, shoppingItems: [...d.shoppingItems, item] }
    })
  },

  /** Abhaken bzw. Haken entfernen (dann ans Ende der offenen Artikel). */
  setChecked(id: string, checked: boolean) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingItems: updateById(d.shoppingItems, id, me, (i) =>
        checked
          ? { checked: true, checkedAt: nowIso(), later: false }
          : { checked: false, checkedAt: null, later: false, sortOrder: nextOpenSortOrder(d.shoppingItems, i.listId) },
      ),
    }))
  },

  /** Unter „Nächster Einkauf“ ablegen bzw. zurück auf die aktuelle Liste holen (jeweils ans Ende). */
  setLater(id: string, later: boolean) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingItems: updateById(d.shoppingItems, id, me, (i) => ({
        later,
        checked: false,
        checkedAt: null,
        sortOrder: nextOpenSortOrder(d.shoppingItems, i.listId, later),
      })),
    }))
  },

  /** „Alle in die Liste holen“: alles aus „Nächster Einkauf“ in der bisherigen Reihenfolge ans Ende. */
  allNow(listId: string) {
    const me = currentPersonId()
    updateData((d) => {
      const { later } = splitItems(d.shoppingItems, listId)
      if (later.length === 0) return d
      const base = nextOpenSortOrder(d.shoppingItems, listId)
      const pos = new Map(later.map((i, k) => [i.id, base + k]))
      return {
        ...d,
        shoppingItems: d.shoppingItems.map((i) =>
          pos.has(i.id) ? touch(i, me, { later: false, sortOrder: pos.get(i.id)! }) : i,
        ),
      }
    })
  },

  save(id: string, input: Required<ItemInput>) {
    const me = currentPersonId()
    const name = input.name.trim()
    if (!name) return
    updateData((d) => ({
      ...d,
      shoppingItems: updateById(d.shoppingItems, id, me, {
        name,
        quantity: input.quantity.trim(),
        note: input.note.trim(),
      }),
    }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingItems: d.shoppingItems.map((i) => (i.id === id ? tombstone(i, me) : i)),
    }))
  },

  /** „Rückgängig“ nach dem Löschen */
  restore(id: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingItems: d.shoppingItems.map((i) => (i.id === id ? touch(i, me, { deleted: false }) : i)),
    }))
  },

  /** Alle erledigten Artikel einer Liste entfernen. */
  clearChecked(listId: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingItems: d.shoppingItems.map((i) =>
        i.listId === listId && i.checked && !i.deleted ? tombstone(i, me) : i,
      ),
    }))
  },

  /** Neue Reihenfolge der offenen Artikel speichern (nur geänderte Datensätze). */
  reorder(listId: string, orderedIds: string[]) {
    const me = currentPersonId()
    updateData((d) => {
      const { open } = splitItems(d.shoppingItems, listId)
      const changes = reorderChanges(open, orderedIds)
      if (changes.size === 0) return d
      return {
        ...d,
        shoppingItems: d.shoppingItems.map((i) =>
          changes.has(i.id) ? touch(i, me, { sortOrder: changes.get(i.id)! }) : i,
        ),
      }
    })
  },

  // ---------- Listen ----------

  /** Neue Liste anlegen, gibt ihre id zurück. */
  addList(name: string): string | null {
    const me = currentPersonId()
    const trimmed = name.trim()
    if (!trimmed) return null
    const list: ShoppingList = { ...newBase(me), name: trimmed, sortOrder: 0 }
    updateData((d) => {
      const max = Math.max(0, ...alive(d.shoppingLists).map((l) => l.sortOrder))
      return { ...d, shoppingLists: [...d.shoppingLists, { ...list, sortOrder: max + 1 }] }
    })
    return list.id
  },

  renameList(id: string, name: string) {
    const me = currentPersonId()
    const trimmed = name.trim()
    if (!trimmed) return
    updateData((d) => ({ ...d, shoppingLists: updateById(d.shoppingLists, id, me, { name: trimmed }) }))
  },

  /** Liste samt Artikeln löschen. */
  removeList(id: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      shoppingLists: d.shoppingLists.map((l) => (l.id === id ? tombstone(l, me) : l)),
      shoppingItems: d.shoppingItems.map((i) => (i.listId === id && !i.deleted ? tombstone(i, me) : i)),
    }))
  },
}
