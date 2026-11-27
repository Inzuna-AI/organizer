import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import type { Meal, Recipe } from '@/types/data'
import { addDays, berlinDateString, formatDay, formatYmd, nowIso, weekdayShort } from '@/lib/dates'
import { holidayOn } from '@/lib/holidays'
import { loadPref, savePref } from '@/lib/storage'
import { Button } from '@/components/ui/Button'
import { Fab } from '@/components/ui/Fab'
import { Tabs } from '@/components/ui/Tabs'
import { TextareaField } from '@/components/ui/Field'
import { TextField } from '@/components/ui/TextField'
import { useGoBack } from '@/components/layout/useGoBack'
import { planAdd, shoppingActions, useAllShoppingItems, useShoppingLists } from '@/features/shopping'
import { SwipeToClear } from './components/SwipeToClear'
import { mealActions, recipeActions, useAllMeals, useMealsByDate, useRecipe, useRecipeMap, useRecipes, useSoonRecipes } from './store'
import {
  categoryOptions,
  collectIngredients,
  DEFAULT_KINDS,
  DEFAULT_SIDES,
  EFFORT_LABELS,
  EMPTY_FILTER,
  EMPTY_RECIPE,
  filterRecipes,
  joinQuantities,
  kindIcon,
  lastEatenLabel,
  mealTitle,
  pickRandom,
  recipeUsage,
  SPEED_LABELS,
  weekDates,
  weekLabel,
  weekStart,
  type RecipeDraft,
  type RecipeFilter,
} from './utils'
import {
  CategoryPicker,
  IngredientEditor,
  RatingPicker,
  RecipeBadges,
  RecipeFilterBar,
  RecipeRow,
} from './components/RecipeParts'

const isDate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

/** Auswahl für Art und Beilage: Vorgaben plus eigene Werte aus allen Gerichten */
function useCategories() {
  const recipes = useRecipes()
  return useMemo(
    () => ({
      kinds: categoryOptions(DEFAULT_KINDS, recipes.map((r) => r.kind)),
      sides: categoryOptions(DEFAULT_SIDES, recipes.map((r) => r.side)),
    }),
    [recipes],
  )
}

function useUsage(today: string) {
  const meals = useAllMeals()
  return useMemo(() => recipeUsage(meals, today), [meals, today])
}

// ---------- Übersicht: Wochenplan | Gerichte ----------

export function MealsPage() {
  const [params, setParams] = useSearchParams()
  const view = params.get('ansicht') === 'gerichte' ? 'recipes' : 'week'
  const setView = (v: 'week' | 'recipes') => {
    const next = new URLSearchParams(params)
    if (v === 'recipes') next.set('ansicht', 'gerichte')
    else next.delete('ansicht')
    setParams(next, { replace: true })
  }
  return (
    <div className="space-y-4 p-4">
      <Tabs
        value={view}
        options={[
          { value: 'week', label: '📅 Wochenplan' },
          { value: 'recipes', label: '📖 Gerichte' },
        ]}
        onChange={setView}
      />
      {view === 'week' ? <WeekView /> : <RecipesView />}
    </div>
  )
}

function WeekView() {
  const [params, setParams] = useSearchParams()
  const today = berlinDateString()
  const woche = params.get('woche')
  const monday = isDate(woche) ? weekStart(woche) : weekStart(today)
  const go = (n: number) => {
    const next = new URLSearchParams(params)
    const target = addDays(monday, 7 * n)
    if (target === weekStart(today)) next.delete('woche')
    else next.set('woche', target)
    setParams(next, { replace: true })
  }
  const days = weekDates(monday)
  const sunday = days[6]
  const byDate = useMealsByDate()
  const recipes = useRecipeMap()
  const meals = useAllMeals()
  const label = weekLabel(monday, today)
  // Einkaufen ab heute, wenn die Woche schon läuft
  const from = monday < today && today <= sunday ? today : monday
  const needs = useMemo(() => collectIngredients(meals, recipes, from, sunday), [meals, recipes, from, sunday])
  const isPast = sunday < today
  const soon = useSoonRecipes()
  // Wischen nach links entfernt das Gericht vom Tag, mit „Rückgängig“
  const [undo, setUndo] = useState<{ meal: Meal; title: string } | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    },
    [],
  )

  function clearDay(meal: Meal) {
    mealActions.clear(meal.date)
    setUndo({ meal, title: mealTitle(meal, recipes) })
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 5000)
  }

  function onUndo() {
    if (!undo) return
    const { meal } = undo
    mealActions.set(meal.date, { recipeId: meal.recipeId, text: meal.text, note: meal.note })
    setUndo(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Vorherige Woche"
          className="flex size-11 items-center justify-center rounded-full text-xl text-slate-600 active:bg-slate-100"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-semibold">{label.relative || `KW ${isoWeek(monday)}`}</p>
          <p className="text-xs text-slate-500">{label.range}</p>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Nächste Woche"
          className="flex size-11 items-center justify-center rounded-full text-xl text-slate-600 active:bg-slate-100"
        >
          ›
        </button>
      </div>

      <ul className="space-y-2 lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-4 lg:gap-2 lg:space-y-0">
        {days.map((date) => {
          const meal = byDate.get(date)
          const recipe = meal?.recipeId ? recipes.get(meal.recipeId) : null
          const holiday = holidayOn(date)
          const isToday = date === today
          return (
            <li key={date}>
              <SwipeToClear onClear={meal ? () => clearDay(meal) : undefined}>
                <Link
                  to={`/essen/tag/${date}`}
                  draggable={false}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border bg-white px-3 py-2 active:opacity-80 ${
                    isToday ? 'border-brand-600 ring-1 ring-brand-600 ring-inset' : 'border-slate-200'
                  } ${date < today ? 'opacity-60' : ''}`}
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className={`text-sm font-semibold ${isToday ? 'text-brand-700' : ''}`}>{weekdayShort(date)}</p>
                    <p className="text-xs text-slate-500">{formatYmd(date).slice(0, 6)}</p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    {holiday && <p className="truncate text-xs text-amber-700 dark:text-amber-300">🎉 {holiday.name}</p>}
                    {meal ? (
                      <>
                        <p className="font-medium break-words">
                          {recipe?.kind && kindIcon(recipe.kind) ? `${kindIcon(recipe.kind)} ` : ''}
                          {mealTitle(meal, recipes)}
                        </p>
                        {recipe && <RecipeBadges recipe={{ ...recipe, kind: null }} />}
                        {meal.note && <p className="text-xs whitespace-pre-line text-slate-500">{meal.note}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">＋ Mittagessen planen</p>
                    )}
                  </div>
                </Link>
              </SwipeToClear>
            </li>
          )
        })}
      </ul>

      {soon.length > 0 && (
        <section className="rounded-2xl border border-dashed border-brand-600 bg-white p-3">
          <h3 className="text-sm font-semibold">🔖 Bald mal wieder</h3>
          <p className="mb-2 text-xs text-slate-500">Tippt oben auf einen Tag, um eins davon zu planen. Geplant = von der Liste.</p>
          <div className="flex flex-wrap gap-1.5">
            {soon.map((r) => (
              <Link
                key={r.id}
                to={`/essen/gerichte/${r.id}`}
                className="inline-flex min-h-9 items-center rounded-full border border-slate-300 bg-white px-3 text-sm active:bg-slate-100"
              >
                {kindIcon(r.kind) ? `${kindIcon(r.kind)} ` : ''}
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isPast &&
        (needs.length === 0 ? (
          <p className="text-center text-xs text-slate-500">
            🛒 Sobald Gerichte mit Zutaten geplant sind, könnt ihr sie hier auf den Einkaufszettel setzen.
          </p>
        ) : (
          <Link
            to={`/essen/einkaufen?von=${from}&bis=${sunday}`}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-medium text-white active:bg-brand-800"
          >
            🛒 Zutaten einkaufen ({needs.length}){from > monday ? ' · ab heute' : ''}
          </Link>
        ))}

      <AnimatePresence>
        {undo && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bottom-above-nav fixed right-4 left-4 z-30 mx-auto lg:left-60 flex max-w-md items-center gap-3 rounded-xl bg-slate-800 py-2 pr-2 pl-4 text-sm text-white shadow-lg dark:bg-slate-200"
          >
            <span className="min-w-0 flex-1 truncate">„{undo.title}“ entfernt</span>
            <button
              type="button"
              onClick={onUndo}
              className="min-h-10 rounded-lg px-3 font-semibold text-brand-100 active:bg-slate-700 dark:text-teal-300 dark:active:bg-slate-300"
            >
              Rückgängig
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** ISO-Kalenderwoche eines Montags */
function isoWeek(monday: string): number {
  const thursday = new Date(`${addDays(monday, 3)}T00:00:00Z`)
  const jan1 = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.floor((thursday.getTime() - jan1) / 86_400_000 / 7) + 1
}

function RecipesView() {
  const recipes = useRecipes()
  const today = berlinDateString()
  const usage = useUsage(today)
  const { kinds, sides } = useCategories()
  const [filter, setFilterState] = useState<RecipeFilter>(() => ({ ...EMPTY_FILTER, ...loadPref<Partial<RecipeFilter>>('mealsFilter', {}), query: '' }))
  const setFilter = (f: RecipeFilter) => {
    setFilterState(f)
    savePref('mealsFilter', { ...f, query: '' })
  }
  const list = useMemo(() => filterRecipes(recipes, filter), [recipes, filter])

  return (
    <div className="space-y-3">
      <RecipeFilterBar filter={filter} onChange={setFilter} kinds={kinds} sides={sides} />
      {recipes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine Gerichte. Mit „+“ legt ihr euer erstes Gericht samt Zutaten an.
        </p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Kein Gericht passt zu Suche und Filter.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {list.length === recipes.length ? `${recipes.length} Gerichte` : `${list.length} von ${recipes.length} Gerichten`}
          </p>
          <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 xl:grid-cols-3">
            {list.map((r) => (
              <RecipeRow key={r.id} recipe={r} usage={usage.get(r.id)} today={today} />
            ))}
          </ul>
        </>
      )}
      <Fab to="/essen/gerichte/neu" label="Neues Gericht" />
    </div>
  )
}

// ---------- Einen Tag planen ----------

const QUICK_TEXTS = ['Reste', 'Essen gehen', 'Bestellen', 'Jeder für sich']

export function MealDayPage() {
  const { date: param } = useParams()
  const date = isDate(param) ? param : berlinDateString()
  const navigate = useNavigate()
  const goBack = useGoBack(`/essen?woche=${weekStart(date)}`)
  const today = berlinDateString()
  const meal = useMealsByDate().get(date) ?? null
  const recipes = useRecipes()
  const recipeMap = useRecipeMap()
  const usage = useUsage(today)
  const { kinds, sides } = useCategories()
  const [filter, setFilter] = useState<RecipeFilter>(EMPTY_FILTER)
  const [text, setText] = useState(meal && !meal.recipeId ? meal.text : '')
  const [note, setNote] = useState(meal?.note ?? '')
  // Vorschlag in der URL, damit er nach „Rezept ansehen“ und Zurück noch da ist
  const [params, setParams] = useSearchParams()
  const suggestionId = params.get('vorschlag')
  const suggestion = (suggestionId && recipes.find((r) => r.id === suggestionId)) || null
  const [moveTo, setMoveTo] = useState('')
  const list = useMemo(() => filterRecipes(recipes, filter), [recipes, filter])
  const soon = useSoonRecipes()
  // Merkliste oben, solange nicht gesucht oder gefiltert wird
  const showSoon = soon.length > 0 && filter === EMPTY_FILTER

  const current = meal?.recipeId ? recipeMap.get(meal.recipeId) : null

  function choose(recipeId: string | null, freeText = '') {
    mealActions.set(date, { recipeId, text: freeText, note })
    goBack()
  }

  function suggest() {
    const next = pickRandom(list, usage, date, { exclude: suggestion?.id ?? null })
    setParams(next ? { vorschlag: next.id } : {}, { replace: true })
  }

  const holiday = holidayOn(date)

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-xl font-semibold">
          {weekdayShort(date)}, {formatYmd(date)}
          {['Heute', 'Morgen', 'Gestern'].includes(formatDay(date, today)) && (
            <span className="ml-2 text-base font-normal text-slate-500">{formatDay(date, today)}</span>
          )}
        </h2>
        {holiday && <p className="text-sm text-amber-700 dark:text-amber-300">🎉 {holiday.name}</p>}
      </div>

      {meal && (
        <section className="space-y-3 rounded-2xl border border-brand-600 bg-white p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium text-brand-700">Geplant</p>
              <p className="text-lg font-semibold break-words">
                {current?.kind && kindIcon(current.kind) ? `${kindIcon(current.kind)} ` : ''}
                {mealTitle(meal, recipeMap)}
              </p>
              {current && <RecipeBadges recipe={{ ...current, kind: null }} />}
            </div>
            {current && !current.deleted && (
              <Link to={`/essen/gerichte/${current.id}`} className="min-h-9 shrink-0 rounded-lg px-2 py-2 text-sm text-brand-700">
                Rezept
              </Link>
            )}
          </div>
          <TextareaField
            label="Notiz"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note.trim() !== meal.note) mealActions.set(date, { recipeId: meal.recipeId, text: meal.text, note })
            }}
            placeholder="z. B. doppelte Menge, Rest für Mittwoch"
          />
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label="Auf anderen Tag verschieben"
              type="date"
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              className="min-w-40 flex-1"
            />
            <Button
              variant="secondary"
              disabled={!isDate(moveTo) || moveTo === date}
              onClick={() => {
                mealActions.move(date, moveTo)
                navigate(`/essen?woche=${weekStart(moveTo)}`, { replace: true })
              }}
            >
              Verschieben
            </Button>
          </div>
          <Button
            variant="danger"
            block
            onClick={() => {
              mealActions.clear(date)
              goBack()
            }}
          >
            Nichts mehr geplant
          </Button>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500">{meal ? 'Etwas anderes wählen' : 'Gericht wählen'}</h3>
        <RecipeFilterBar filter={filter} onChange={setFilter} kinds={kinds} sides={sides} />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={list.length === 0} onClick={suggest}>
            🎲 {suggestion ? 'Anderer Vorschlag' : 'Was essen wir?'}
          </Button>
          <Link
            to={`/essen/gerichte/neu?fuer=${date}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 active:bg-slate-100"
          >
            ＋ Neues Gericht
          </Link>
        </div>
        {suggestion && (
          <div className="space-y-2 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/50">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Vorschlag</p>
            <ul>
              <RecipeRow recipe={suggestion} usage={usage.get(suggestion.id)} today={today} highlight />
            </ul>
            <div className="flex gap-2">
              <Link
                to={`/essen/gerichte/${suggestion.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 active:bg-slate-100"
              >
                📖 Rezept ansehen
              </Link>
              <Button className="flex-1" onClick={() => choose(suggestion.id)}>
                Übernehmen
              </Button>
            </div>
          </div>
        )}
        {showSoon && (
          <div className="space-y-2">
            <p className="pt-1 text-xs font-semibold text-slate-500">🔖 Bald mal wieder</p>
            <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
              {soon.map((r) => (
                <RecipeRow key={r.id} recipe={r} usage={usage.get(r.id)} today={today} onSelect={() => choose(r.id)} />
              ))}
            </ul>
            <p className="pt-2 text-xs font-semibold text-slate-500">Alle Gerichte</p>
          </div>
        )}
        {recipes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            Noch keine Gerichte in der Datenbank. Legt eins mit „＋ Neues Gericht“ an oder tragt unten einen Freitext ein.
          </p>
        ) : list.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Kein Gericht passt zu Suche und Filter.</p>
        ) : (
          <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
            {list.map((r) => (
              <RecipeRow
                key={r.id}
                recipe={r}
                usage={usage.get(r.id)}
                today={today}
                selected={meal?.recipeId === r.id}
                onSelect={() => choose(r.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500">Oder ohne Gericht</h3>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TEXTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => choose(null, t)}
              className="min-h-9 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 active:bg-slate-100"
            >
              {t}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) choose(null, text)
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Freitext, z. B. Pfannkuchen bei Oma"
            aria-label="Freitext"
            enterKeyHint="done"
            className="block min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600"
          />
          <Button type="submit" disabled={!text.trim()}>
            Übernehmen
          </Button>
        </form>
      </section>
    </div>
  )
}

// ---------- Gericht anlegen/bearbeiten ----------

function toDraft(r: Recipe | null): RecipeDraft {
  if (!r) return EMPTY_RECIPE
  const { title, ingredients, note, link, speed, effort, side, kind, favorite } = r
  return { title, ingredients, note, link, speed, effort, side, kind, favorite, soon: r.soon ?? null }
}

/** /essen/gerichte/neu (optional ?fuer=<Datum>: direkt für diesen Tag planen) und /essen/gerichte/:id */
export function RecipeEditPage() {
  const { id: param } = useParams()
  const [params] = useSearchParams()
  const isNew = param === 'neu'
  const recipe = useRecipe(isNew ? null : (param ?? null))
  const navigate = useNavigate()
  const goBack = useGoBack('/essen?ansicht=gerichte')
  const { kinds, sides } = useCategories()
  const today = berlinDateString()
  const usage = useUsage(today)
  const [draft, setDraft] = useState<RecipeDraft>(() => toDraft(recipe))
  const set = (changes: Partial<RecipeDraft>) => setDraft((d) => ({ ...d, ...changes }))
  const planFor = params.get('fuer')

  if (!isNew && !recipe) return <p className="p-8 text-center text-sm text-slate-500">Dieses Gericht gibt es nicht mehr.</p>

  function save() {
    if (!draft.title.trim()) return
    if (recipe) {
      recipeActions.save(recipe.id, draft)
      goBack()
      return
    }
    const id = recipeActions.create(draft)
    if (isDate(planFor)) {
      mealActions.set(planFor, { recipeId: id, text: '', note: '' })
      navigate(`/essen?woche=${weekStart(planFor)}`, { replace: true })
    } else goBack()
  }

  const u = recipe ? usage.get(recipe.id) : undefined

  return (
    <form
      className="space-y-5 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <TextField
        label="Name"
        value={draft.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="z. B. Spaghetti Bolognese"
        autoFocus={isNew}
        enterKeyHint="next"
      />
      <IngredientEditor items={draft.ingredients} onChange={(ingredients) => set({ ingredients })} />
      <CategoryPicker label="Art" options={kinds} value={draft.kind} onChange={(kind) => set({ kind })} icon={kindIcon} />
      <CategoryPicker label="Beilage" options={sides} value={draft.side} onChange={(side) => set({ side })} />
      <RatingPicker label="Zeit" labels={SPEED_LABELS} value={draft.speed} onChange={(speed) => set({ speed })} />
      <RatingPicker label="Aufwand" labels={EFFORT_LABELS} value={draft.effort} onChange={(effort) => set({ effort })} />
      <TextareaField
        label="Zubereitung / Notiz"
        rows={4}
        value={draft.note}
        onChange={(e) => set({ note: e.target.value })}
        placeholder="Optional"
      />
      <TextField
        label="Link zum Rezept"
        type="url"
        inputMode="url"
        value={draft.link}
        onChange={(e) => set({ link: e.target.value })}
        placeholder="https://…"
      />
      {recipe?.link && /^https?:\/\//.test(recipe.link) && (
        <a href={recipe.link} target="_blank" rel="noreferrer" className="-mt-3 block text-sm text-brand-700 underline">
          Rezept öffnen ↗
        </a>
      )}
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={draft.favorite}
          onChange={(e) => set({ favorite: e.target.checked })}
          className="size-5 accent-amber-500"
        />
        <span className="text-sm">★ Favorit</span>
      </label>
      <label className="-mt-3 flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={!!draft.soon}
          onChange={(e) => set({ soon: e.target.checked ? (recipe?.soon ?? nowIso()) : null })}
          className="size-5 accent-brand-700"
        />
        <span className="text-sm">🔖 Bald mal wieder (Merkliste)</span>
      </label>

      {recipe && (
        <p className="text-xs text-slate-500">
          Zuletzt gegessen: {lastEatenLabel(u?.last ?? null, today)}
          {u?.next ? ` · geplant für ${formatDay(u.next, today)}` : ''}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={goBack}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={!draft.title.trim()}>
          {isDate(planFor) && isNew ? 'Speichern & planen' : 'Speichern'}
        </Button>
      </div>

      {recipe && (
        <Button
          variant="danger"
          block
          onClick={() => {
            if (!window.confirm(`„${recipe.title}“ löschen? Bereits geplante Mittagessen behalten den Namen.`)) return
            recipeActions.remove(recipe.id)
            navigate('/essen?ansicht=gerichte', { replace: true })
          }}
        >
          Gericht löschen
        </Button>
      )}
    </form>
  )
}

// ---------- Zutaten einkaufen ----------

export function MealShoppingPage() {
  const [params] = useSearchParams()
  const today = berlinDateString()
  const from = isDate(params.get('von')) ? params.get('von')! : today
  const to = isDate(params.get('bis')) ? params.get('bis')! : addDays(weekStart(from), 6)
  const goBack = useGoBack(`/essen?woche=${weekStart(from)}`)
  const meals = useAllMeals()
  const byDate = useMealsByDate()
  const recipes = useRecipeMap()
  const lists = useShoppingLists()
  const items = useAllShoppingItems()
  const needs = useMemo(() => collectIngredients(meals, recipes, from, to), [meals, recipes, from, to])

  const [listId, setListIdState] = useState<string | null>(() => loadPref<string | null>('mealsShoppingList', null))
  const activeList = lists.find((l) => l.id === listId) ?? lists[0] ?? null
  const setListId = (id: string) => {
    setListIdState(id)
    savePref('mealsShoppingList', id)
  }
  const [later, setLater] = useState(false)
  /** Vom Standard abweichend an- bzw. abgewählte Zutaten */
  const [toggled, setToggled] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<number | null>(null)

  const onList = (name: string) => !!activeList && planAdd(items, activeList.id, name, later).kind === 'exists'
  // Standard: alles an, außer was schon offen auf der Liste steht
  const isSelected = (key: string, name: string) => !onList(name) !== toggled.has(key)
  const selected = needs.filter((n) => isSelected(n.key, n.name))

  const planned = [...byDate.values()].filter((m) => m.date >= from && m.date <= to).sort((a, b) => a.date.localeCompare(b.date))

  if (done !== null) {
    return (
      <div className="space-y-4 p-4 text-center">
        <p className="pt-6 text-4xl">🛒</p>
        <p className="text-lg font-semibold">
          {done === 1 ? '1 Zutat' : `${done} Zutaten`} auf „{activeList?.name ?? 'Einkauf'}“
          {later ? ' (Nächster Einkauf)' : ''}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/einkauf"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 text-sm font-medium text-white"
          >
            Zum Einkaufszettel
          </Link>
          <Button variant="secondary" onClick={goBack}>
            Zurück zum Wochenplan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">
          {formatDay(from, today)} bis {formatDay(to, today)}
        </h2>
        <p className="text-sm text-slate-500">
          {planned.map((m) => `${weekdayShort(m.date)}: ${mealTitle(m, recipes)}`).join(' · ') || 'Nichts geplant'}
        </p>
      </div>

      {needs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Für diesen Zeitraum sind keine Gerichte mit Zutaten geplant.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Abwählen, was ihr schon zu Hause habt:</p>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {needs.map((n) => {
              const sel = isSelected(n.key, n.name)
              const already = onList(n.name)
              return (
                <li key={n.key}>
                  <label className="flex min-h-14 items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() =>
                        setToggled((t) => {
                          const next = new Set(t)
                          if (next.has(n.key)) next.delete(n.key)
                          else next.add(n.key)
                          return next
                        })
                      }
                      className="size-6 shrink-0 accent-brand-700"
                    />
                    <span className={`min-w-0 flex-1 ${sel ? '' : 'text-slate-400'}`}>
                      <span className="font-medium">{n.name}</span>
                      {n.quantities.length > 0 && <span className="text-slate-500"> · {joinQuantities(n.quantities)}</span>}
                      <span className="block truncate text-xs text-slate-500">
                        {already ? '✓ steht schon auf der Liste · ' : ''}
                        {n.recipes.join(', ')}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          {lists.length > 1 && (
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={activeList?.id === l.id}
                  onClick={() => setListId(l.id)}
                  className={`min-h-9 shrink-0 rounded-full border px-3 text-sm ${
                    activeList?.id === l.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} className="size-5 accent-brand-700" />
            <span className="text-sm">Für den nächsten Einkauf</span>
          </label>

          <Button
            block
            disabled={selected.length === 0}
            onClick={() => {
              for (const n of selected) {
                shoppingActions.add(activeList?.id ?? null, { name: n.name, quantity: joinQuantities(n.quantities) }, null, later)
              }
              setDone(selected.length)
            }}
          >
            {selected.length === 1 ? '1 Zutat' : `${selected.length} Zutaten`} auf „{activeList?.name ?? 'Einkauf'}“
          </Button>
        </>
      )}
    </div>
  )
}
