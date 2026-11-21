import { useMemo, useRef, useState, type FormEvent } from 'react'
import type { ShoppingItem } from '@/types/data'
import { suggest, type Suggestion } from '../utils'

interface Props {
  listId: string | null
  items: ShoppingItem[]
  /** Schalter „Für den nächsten Einkauf“: neue Artikel landen unter „Nächster Einkauf“ */
  later: boolean
  onLaterChange: (later: boolean) => void
  /** `now` = auf jeden Fall auf die aktuelle Liste (Vorschlag aus „Nächster Einkauf“) */
  onAdd: (input: { name: string; quantity: string; note: string }, reopenId: string | null, now?: boolean) => void
}

const inputClass =
  'block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

/** Eingabefeld oben: Enter fügt hinzu, das Feld bleibt fokussiert. Mit Vorschlägen beim Tippen. */
export function AddItemInput({ listId, items, later, onLaterChange, onAdd }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [details, setDetails] = useState(false)
  const [focused, setFocused] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => (listId ? suggest(items, listId, name) : []), [items, listId, name])
  const showSuggestions = focused && suggestions.length > 0

  function reset() {
    setName('')
    setQuantity('')
    setNote('')
    nameRef.current?.focus()
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name, quantity, note }, null)
    reset()
  }

  function pick(s: Suggestion) {
    onAdd({ name: s.name, quantity: quantity || s.quantity, note: note || s.note }, s.reopenId, s.later)
    reset()
  }

  return (
    <form onSubmit={submit} className="relative space-y-2">
      <div className="flex gap-2">
        <input
          ref={nameRef}
          className={inputClass}
          placeholder={later ? 'Für den nächsten Einkauf …' : 'Artikel hinzufügen …'}
          aria-label="Artikel"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          enterKeyHint="enter"
          autoComplete="off"
          autoCapitalize="sentences"
        />
        <button
          type="button"
          aria-label={details ? 'Menge und Notiz ausblenden' : 'Menge und Notiz'}
          aria-expanded={details}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setDetails(!details)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg ${
            details ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-500'
          }`}
        >
          ⋯
        </button>
        <button
          type="submit"
          aria-label="Hinzufügen"
          // Fokus im Eingabefeld behalten, damit die Tastatur offen bleibt
          onPointerDown={(e) => e.preventDefault()}
          disabled={!name.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-2xl text-white disabled:bg-slate-300"
        >
          +
        </button>
      </div>

      {details && (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
          <input
            className={inputClass}
            placeholder="Menge, z. B. 2 l"
            aria-label="Menge"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Notiz"
            aria-label="Notiz"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      <button
        type="button"
        aria-pressed={later}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onLaterChange(!later)}
        className={`min-h-9 rounded-full border px-3 text-sm ${
          later ? 'border-amber-500 bg-amber-50 font-semibold text-amber-700' : 'border-slate-200 text-slate-500'
        }`}
      >
        {later ? '✓ ' : ''}Für den nächsten Einkauf
      </button>

      {showSuggestions && (
        <ul
          className="absolute top-12 right-0 left-0 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          aria-label="Vorschläge"
        >
          {suggestions.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex min-h-11 w-full items-center gap-2 px-3 text-left active:bg-slate-100"
              >
                <span className="flex-1 truncate">{s.name}</span>
                {s.quantity && <span className="text-sm text-slate-500">{s.quantity}</span>}
                <span className="text-xs text-slate-400">
                  {s.later ? 'aus Nächster Einkauf' : s.reopenId ? 'wieder auf die Liste' : 'neu'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
