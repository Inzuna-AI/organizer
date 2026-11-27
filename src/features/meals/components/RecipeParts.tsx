import { useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Ingredient, Rating, Recipe } from '@/types/data'
import { uuid } from '@/lib/records'
import { Chip } from '@/components/ui/Chip'
import { recipeActions } from '../store'
import {
  activeFilterCount,
  capitalizeFirst,
  EFFORT_LABELS,
  kindIcon,
  lastEatenLabel,
  ratingLabel,
  SPEED_LABELS,
  type RecipeFilter,
  type RecipeUsage,
} from '../utils'

/** Kleine Abzeichen: Art, Beilage, Zeit, Aufwand */
export function RecipeBadges({ recipe }: { recipe: Recipe }) {
  const parts = [
    recipe.kind ? `${kindIcon(recipe.kind)} ${recipe.kind}`.trim() : null,
    recipe.side,
    ratingLabel(SPEED_LABELS, recipe.speed),
    ratingLabel(EFFORT_LABELS, recipe.effort),
  ].filter(Boolean) as string[]
  if (parts.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((p) => (
        <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {p}
        </span>
      ))}
    </div>
  )
}

/** Stern zum Merken als Favorit */
export function FavoriteButton({ recipe }: { recipe: Recipe }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        recipeActions.toggleFavorite(recipe.id)
      }}
      aria-pressed={recipe.favorite}
      aria-label={recipe.favorite ? 'Kein Favorit mehr' : 'Als Favorit merken'}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-slate-100 ${
        recipe.favorite ? 'text-amber-500' : 'text-slate-300'
      }`}
    >
      {recipe.favorite ? '★' : '☆'}
    </button>
  )
}

/** Lesezeichen: auf die Merkliste „Bald mal wieder“ */
export function SoonButton({ recipe }: { recipe: Recipe }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        recipeActions.toggleSoon(recipe.id)
      }}
      aria-pressed={!!recipe.soon}
      aria-label={recipe.soon ? 'Von „Bald mal wieder“ nehmen' : 'Für „Bald mal wieder“ merken'}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg active:bg-slate-100 ${
        recipe.soon ? '' : 'opacity-30 grayscale'
      }`}
    >
      🔖
    </button>
  )
}

interface RowProps {
  recipe: Recipe
  usage?: RecipeUsage
  today: string
  /** Statt Link: Auswahl (z. B. beim Planen eines Tages) */
  onSelect?: () => void
  selected?: boolean
  highlight?: boolean
}

/** Gericht in einer Liste */
export function RecipeRow({ recipe, usage, today, onSelect, selected, highlight }: RowProps) {
  const body = (
    <>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium break-words">{recipe.title}</p>
        <RecipeBadges recipe={recipe} />
        <p className="text-xs text-slate-500">
          Zuletzt: {lastEatenLabel(usage?.last ?? null, today)}
          {usage?.next ? ' · schon geplant' : ''}
          {recipe.ingredients.length > 0 ? ` · ${recipe.ingredients.length} Zutaten` : ''}
        </p>
      </div>
    </>
  )
  const cls = `flex h-full min-h-16 w-full items-center gap-2 rounded-2xl border bg-white py-2 pr-1 pl-4 text-left ${
    selected ? 'border-brand-600 ring-2 ring-brand-100' : highlight ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'
  }`
  return (
    <li>
      {onSelect ? (
        <div className={cls}>
          <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center text-left active:opacity-70">
            {body}
          </button>
          <SoonButton recipe={recipe} />
          <FavoriteButton recipe={recipe} />
        </div>
      ) : (
        <Link to={`/essen/gerichte/${recipe.id}`} className={`${cls} active:opacity-80`}>
          {body}
          <SoonButton recipe={recipe} />
          <FavoriteButton recipe={recipe} />
        </Link>
      )}
    </li>
  )
}

// ---------- Filter ----------

interface FilterProps {
  filter: RecipeFilter
  onChange: (f: RecipeFilter) => void
  sides: string[]
  kinds: string[]
}

/** Suchfeld, Favoriten und aufklappbare Filter nach Art, Beilage, Zeit und Aufwand */
export function RecipeFilterBar({ filter, onChange, sides, kinds }: FilterProps) {
  const count = activeFilterCount(filter)
  const [open, setOpen] = useState(count > 0)
  const set = (changes: Partial<RecipeFilter>) => onChange({ ...filter, ...changes })
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="search"
          value={filter.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Gericht oder Zutat suchen …"
          aria-label="Gerichte durchsuchen"
          enterKeyHint="search"
          className="block min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={() => set({ favorites: !filter.favorites })}
          aria-pressed={filter.favorites}
          aria-label="Nur Favoriten"
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border text-lg ${
            filter.favorites ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-slate-300 bg-white text-slate-400'
          }`}
        >
          ★
        </button>
        <button
          type="button"
          onClick={() => set({ soon: !filter.soon })}
          aria-pressed={filter.soon}
          aria-label="Nur „Bald mal wieder“"
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border text-lg ${
            filter.soon ? 'border-brand-600 bg-brand-50' : 'border-slate-300 bg-white opacity-60 grayscale'
          }`}
        >
          🔖
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`min-h-11 shrink-0 rounded-xl border px-3 text-sm ${
            count > 0 ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          Filter{count > 0 ? ` (${count})` : ''}
        </button>
      </div>
      {open && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          <ChipRow label="Art" options={kinds.map((k) => ({ value: k, label: `${kindIcon(k)} ${k}`.trim() }))} value={filter.kind} onChange={(kind) => set({ kind })} />
          <ChipRow label="Beilage" options={sides.map((s) => ({ value: s, label: s }))} value={filter.side} onChange={(side) => set({ side })} />
          <ChipRow
            label="Zeit"
            options={([1, 2, 3] as const).map((r) => ({ value: r, label: SPEED_LABELS[r] }))}
            value={filter.speed}
            onChange={(speed) => set({ speed })}
          />
          <ChipRow
            label="Aufwand"
            options={([1, 2, 3] as const).map((r) => ({ value: r, label: EFFORT_LABELS[r] }))}
            value={filter.effort}
            onChange={(effort) => set({ effort })}
          />
          {count > 0 && (
            <button
              type="button"
              onClick={() => set({ kind: null, side: null, speed: null, effort: null })}
              className="min-h-9 text-sm text-brand-700"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ChipRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (v: T | null) => void
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
        {options.map((o) => (
          <Chip key={String(o.value)} active={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

// ---------- Formular-Bausteine ----------

/** Einzelauswahl aus Vorgaben plus „＋ Eigene“ (z. B. Art, Beilage) */
export function CategoryPicker({
  label,
  options,
  value,
  onChange,
  icon,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (v: string | null) => void
  icon?: (v: string) => string
}) {
  const [adding, setAdding] = useState(false)
  const [custom, setCustom] = useState('')
  const all = value && !options.includes(value) ? [...options, value] : options
  function addCustom() {
    const t = custom.trim()
    if (t) onChange(t)
    setCustom('')
    setAdding(false)
  }
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {all.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(value === o ? null : o)}>
            {`${icon?.(o) ?? ''} ${o}`.trim()}
          </Chip>
        ))}
        {!adding && (
          <Chip active={false} onClick={() => setAdding(true)}>
            ＋ Eigene
          </Chip>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder={`Eigene ${label}`}
            aria-label={`Eigene ${label}`}
            enterKeyHint="done"
            className="block min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600"
          />
          <button type="button" onClick={addCustom} className="min-h-11 rounded-xl bg-brand-700 px-4 text-sm font-medium text-white">
            OK
          </button>
        </div>
      )}
    </fieldset>
  )
}

/** Bewertung in 3 Stufen; nochmal tippen = keine Angabe */
export function RatingPicker({
  label,
  labels,
  value,
  onChange,
}: {
  label: string
  labels: Record<1 | 2 | 3, string>
  value: Rating
  onChange: (v: Rating) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200 p-1">
        {([1, 2, 3] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={value === r}
            onClick={() => onChange(value === r ? null : r)}
            className={`min-h-10 rounded-lg px-1 text-sm ${value === r ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}
          >
            {labels[r]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Zutatenliste: pro Zutat ein Feld für den Namen und eins für die Menge.
 * Unten steht immer eine leere Zeile bereit; wer dort tippt, legt die nächste Zutat an.
 * Enter: von „Zutat“ zu „Menge“, von „Menge“ zur nächsten Zeile.
 */
export function IngredientEditor({ items, onChange }: { items: Ingredient[]; onChange: (items: Ingredient[]) => void }) {
  // id der leeren Zeile; wird sie beschrieben, wird sie zur Zutat und eine neue leere Zeile entsteht
  const [blankId, setBlankId] = useState(uuid)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const rows: Ingredient[] = [...items, { id: blankId, name: '', quantity: '' }]

  function update(id: string, changes: Partial<Ingredient>) {
    if (id === blankId) {
      onChange([...items, { id, name: '', quantity: '', ...changes }])
      setBlankId(uuid())
    } else onChange(items.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }
  const focus = (key: string) => inputs.current.get(key)?.focus()
  const register = (key: string) => (el: HTMLInputElement | null) => {
    if (el) inputs.current.set(key, el)
    else inputs.current.delete(key)
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium text-slate-700">Zutaten</legend>
      <ul className="space-y-2">
        {rows.map((i, index) => {
          const blank = i.id === blankId
          const next = rows[index + 1]
          return (
            <li key={i.id} className="flex gap-2">
              <input
                ref={register(`${i.id}:name`)}
                value={i.name}
                onChange={(e) => update(i.id, { name: capitalizeFirst(e.target.value) })}
                autoCapitalize="sentences"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    focus(`${i.id}:qty`)
                  }
                }}
                placeholder={blank && items.length > 0 ? 'Weitere Zutat' : 'Zutat'}
                aria-label={blank ? 'Neue Zutat' : `Zutat ${index + 1}`}
                enterKeyHint="next"
                className="block min-h-11 min-w-0 flex-[2] rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600"
              />
              <input
                ref={register(`${i.id}:qty`)}
                value={i.quantity}
                onChange={(e) => update(i.id, { quantity: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    // nächste Zeile; nach dem Tippen ist die leere Zeile bereits nachgerückt
                    if (next) focus(`${next.id}:name`)
                  }
                }}
                placeholder="Menge"
                aria-label={blank ? 'Menge der neuen Zutat' : `Menge ${index + 1}`}
                enterKeyHint="next"
                className="block min-h-11 w-24 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600"
              />
              {blank ? (
                <span className="size-11 shrink-0" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((x) => x.id !== i.id))}
                  aria-label={`${i.name || 'Zutat'} entfernen`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-400 active:bg-slate-100"
                >
                  ✕
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
