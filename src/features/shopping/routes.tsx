import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { AnimatePresence, LayoutGroup, motion, Reorder, useDragControls } from 'motion/react'
import type { ShoppingItem } from '@/types/data'
import { loadPref, savePref } from '@/lib/storage'
import { Chip } from '@/components/ui/Chip'
import { DEFAULT_POLL_MS, setSyncInterval } from '@/store'
import { shoppingActions, useAllShoppingItems, useListItems, useShoppingLists } from './store'
import { AddItemInput } from './components/AddItemInput'
import { ItemRow } from './components/ItemRow'

/** Solange der Einkaufszettel offen ist, häufiger synchronisieren (oft zu zweit gleichzeitig). */
const SHOPPING_POLL_MS = 10_000
const UNDO_MS = 5000

const spring = { type: 'spring', stiffness: 500, damping: 40 } as const

export function ShoppingPage() {
  const lists = useShoppingLists()
  const allItems = useAllShoppingItems()
  const [selected, setSelectedState] = useState<string | null>(() => loadPref<string | null>('shoppingList', null))
  const listId = lists.find((l) => l.id === selected)?.id ?? lists[0]?.id ?? null
  const list = lists.find((l) => l.id === listId) ?? null
  const { open, checked } = useListItems(listId)

  const [doneOpen, setDoneOpenState] = useState<boolean>(() => loadPref('shoppingDoneOpen', true))
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSyncInterval(SHOPPING_POLL_MS)
    return () => {
      setSyncInterval(DEFAULT_POLL_MS)
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  function select(id: string) {
    setSelectedState(id)
    savePref('shoppingList', id)
  }

  function setDoneOpen(v: boolean) {
    setDoneOpenState(v)
    savePref('shoppingDoneOpen', v)
  }

  function remove(item: ShoppingItem) {
    shoppingActions.remove(item.id)
    setUndo({ id: item.id, name: item.name })
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
  }

  function onUndo() {
    if (!undo) return
    shoppingActions.restore(undo.id)
    setUndo(null)
  }

  function newList() {
    const name = window.prompt('Name der neuen Liste, z. B. „Drogerie“')
    const id = name ? shoppingActions.addList(name) : null
    if (id) select(id)
  }

  function renameList() {
    if (!list) return
    const name = window.prompt('Liste umbenennen', list.name)
    if (name) shoppingActions.renameList(list.id, name)
  }

  function deleteList() {
    if (!list) return
    if (window.confirm(`Liste „${list.name}“ mit allen Artikeln löschen?`)) {
      shoppingActions.removeList(list.id)
      setSelectedState(null)
    }
  }

  function clearChecked() {
    if (listId && window.confirm(`${checked.length} erledigte Artikel entfernen?`)) shoppingActions.clearChecked(listId)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Listen">
        {lists.map((l) => (
          <Chip key={l.id} active={l.id === listId} onClick={() => select(l.id)}>
            {l.name}
          </Chip>
        ))}
        <Chip active={false} onClick={newList}>
          + Liste
        </Chip>
      </div>

      <AddItemInput
        listId={listId}
        items={allItems}
        onAdd={(input, reopenId) => shoppingActions.add(listId, input, reopenId)}
      />

      <LayoutGroup>
        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {checked.length > 0 ? 'Alles eingekauft. 🎉' : 'Die Liste ist leer.'}
          </p>
        ) : (
          listId && <OpenItems listId={listId} items={open} onDelete={remove} />
        )}

        {checked.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDoneOpen(!doneOpen)}
                aria-expanded={doneOpen}
                className="flex min-h-11 items-center gap-1 text-sm font-semibold text-slate-500"
              >
                <span className={`inline-block transition-transform ${doneOpen ? 'rotate-90' : ''}`} aria-hidden="true">
                  ›
                </span>
                Erledigt ({checked.length})
              </button>
              <button type="button" onClick={clearChecked} className="min-h-11 px-2 text-sm text-red-700">
                Erledigte entfernen
              </button>
            </div>
            {doneOpen && (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {checked.map((item) => (
                    <motion.li
                      key={item.id}
                      layoutId={item.id}
                      layout="position"
                      transition={spring}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ItemRow
                        item={item}
                        onToggle={() => shoppingActions.setChecked(item.id, false)}
                        onDelete={() => remove(item)}
                        onSave={(v) => shoppingActions.save(item.id, v)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        )}
      </LayoutGroup>

      {list && (
        <div className="flex justify-center gap-4 pt-4 text-sm">
          <button type="button" onClick={renameList} className="min-h-11 px-2 text-slate-500">
            Liste umbenennen
          </button>
          <button type="button" onClick={deleteList} className="min-h-11 px-2 text-red-700">
            Liste löschen
          </button>
        </div>
      )}

      <AnimatePresence>
        {undo && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 left-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-800 py-2 pr-2 pl-4 text-sm text-white shadow-lg"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' }}
          >
            <span className="min-w-0 flex-1 truncate">„{undo.name}“ gelöscht</span>
            <button type="button" onClick={onUndo} className="min-h-10 rounded-lg px-3 font-semibold text-brand-100 active:bg-slate-700">
              Rückgängig
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- Offene Artikel (sortierbar) ----------

function OpenItems({
  listId,
  items,
  onDelete,
}: {
  listId: string
  items: ShoppingItem[]
  onDelete: (item: ShoppingItem) => void
}) {
  // Während des Ziehens eigene Reihenfolge, danach wieder die gespeicherte
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)
  const byId = new Map(items.map((i) => [i.id, i]))
  const ids = items.map((i) => i.id)
  const order = dragOrder
    ? [...dragOrder.filter((id) => byId.has(id)), ...ids.filter((id) => !dragOrder.includes(id))]
    : ids

  function onDragEnd() {
    if (dragOrder) shoppingActions.reorder(listId, order)
    setDragOrder(null)
  }

  return (
    <Reorder.Group as="ul" axis="y" values={order} onReorder={setDragOrder} className="space-y-2">
      <AnimatePresence initial={false}>
        {order.map((id) => {
          const item = byId.get(id)!
          return <OpenItem key={id} item={item} onDragEnd={onDragEnd} onDelete={() => onDelete(item)} />
        })}
      </AnimatePresence>
    </Reorder.Group>
  )
}

function OpenItem({ item, onDragEnd, onDelete }: { item: ShoppingItem; onDragEnd: () => void; onDelete: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item.id}
      layoutId={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      transition={spring}
      exit={{ opacity: 0, height: 0 }}
      whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(15,23,42,0.18)', zIndex: 10 }}
      className="relative rounded-2xl"
    >
      <ItemRow
        item={item}
        onToggle={() => shoppingActions.setChecked(item.id, true)}
        onDelete={onDelete}
        onSave={(v) => shoppingActions.save(item.id, v)}
        onHandleDown={(e: PointerEvent) => controls.start(e)}
      />
    </Reorder.Item>
  )
}
