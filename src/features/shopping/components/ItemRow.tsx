import { useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import type { ShoppingItem } from '@/types/data'

const SWIPE_DELETE_PX = 90

interface Props {
  item: ShoppingItem
  onToggle: () => void
  onDelete: () => void
  onSave: (input: { name: string; quantity: string; note: string }) => void
  /** Griff zum Sortieren (nur bei offenen Artikeln) */
  onHandleDown?: (e: PointerEvent) => void
}

/** Inhalt einer Zeile: Checkbox, Text (antippen = bearbeiten), Wischen nach links = löschen. */
export function ItemRow({ item, onToggle, onDelete, onSave, onHandleDown }: Props) {
  const [editing, setEditing] = useState(false)
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-SWIPE_DELETE_PX, -20, 0], [1, 0.4, 0])
  // Nach einem Wischen keinen Klick auslösen
  const swiped = useRef(false)

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DELETE_PX || info.velocity.x < -600) onDelete()
    setTimeout(() => (swiped.current = false), 50)
  }

  if (editing) {
    return <ItemEditor item={item} onCancel={() => setEditing(false)} onSave={(v) => (onSave(v), setEditing(false))} />
  }

  const checked = item.checked
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        aria-hidden="true"
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end bg-red-600 pr-5 text-sm font-medium text-white"
      >
        Löschen
      </motion.div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.8, right: 0 }}
        dragSnapToOrigin
        onDragStart={() => (swiped.current = true)}
        onDragEnd={onDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        className={`relative flex items-stretch border bg-white ${
          checked ? 'border-slate-100' : 'border-slate-200'
        } rounded-2xl`}
      >
        <button
          type="button"
          onClick={() => !swiped.current && onToggle()}
          aria-label={checked ? `Haken bei „${item.name}“ entfernen` : `„${item.name}“ abhaken`}
          aria-pressed={checked}
          className="flex w-14 shrink-0 items-center justify-center active:bg-slate-50"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
              checked ? 'border-slate-300 bg-slate-300 text-white' : 'border-slate-400'
            }`}
          >
            {checked && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => !swiped.current && setEditing(true)}
          className="min-h-14 min-w-0 flex-1 py-2 pr-2 text-left"
          aria-label={`„${item.name}“ bearbeiten`}
        >
          <span className={`flex items-baseline gap-2 ${checked ? 'text-slate-400 line-through' : ''}`}>
            <span className="min-w-0 truncate text-base">{item.name}</span>
            {item.quantity && <span className="shrink-0 text-sm text-slate-500">{item.quantity}</span>}
          </span>
          {item.note && (
            <span className={`block truncate text-xs ${checked ? 'text-slate-300' : 'text-slate-500'}`}>{item.note}</span>
          )}
        </button>
        {onHandleDown && (
          <span
            role="button"
            aria-label={`„${item.name}“ verschieben`}
            onPointerDown={onHandleDown}
            style={{ touchAction: 'none' }}
            className="flex w-12 shrink-0 cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>
        )}
      </motion.div>
    </div>
  )
}

function ItemEditor({
  item,
  onSave,
  onCancel,
}: {
  item: ShoppingItem
  onSave: (v: { name: string; quantity: string; note: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)
  const [note, setNote] = useState(item.note)
  const input =
    'block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

  function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim()) onSave({ name, quantity, note })
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-brand-600 bg-white p-3">
      <input className={input} aria-label="Artikel" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
        <input className={input} aria-label="Menge" placeholder="Menge" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input className={input} aria-label="Notiz" placeholder="Notiz" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl px-4 text-sm text-slate-600 active:bg-slate-100">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="min-h-11 rounded-xl bg-brand-700 px-4 text-sm font-medium text-white disabled:bg-slate-300"
        >
          Speichern
        </button>
      </div>
    </form>
  )
}
