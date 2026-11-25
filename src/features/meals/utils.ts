// Essensplaner: reine Logik (Gerichte filtern, Wochenplan, Zutaten sammeln, Zufallsvorschlag).
import type { Ingredient, Meal, Rating, Recipe } from '@/types/data'
import { addDays, formatYmd } from '@/lib/dates'
import { periodStartOf } from '@/lib/periods'
import { matches, normalize } from '@/lib/text'

// ---------- Kategorien und Bewertungen ----------

/** Vorgegebene Sättigungsbeilagen; eigene kommen aus den Gerichten dazu */
export const DEFAULT_SIDES = ['Kartoffeln', 'Nudeln', 'Reis', 'Brot', 'ohne Beilage'] as const
/** Vorgegebene Arten; eigene kommen aus den Gerichten dazu */
export const DEFAULT_KINDS = ['Fleisch', 'Geflügel', 'Fisch', 'vegetarisch', 'vegan'] as const

const KIND_ICONS: Record<string, string> = {
  fleisch: '🥩',
  geflugel: '🍗',
  fisch: '🐟',
  vegetarisch: '🥕',
  vegan: '🌱',
}

/** Symbol zur Art (eigene Arten ohne Symbol) */
export function kindIcon(kind: string | null): string {
  return kind ? (KIND_ICONS[normalize(kind)] ?? '') : ''
}

export const SPEED_LABELS: Record<1 | 2 | 3, string> = { 1: '⚡ schnell', 2: '⏱️ mittel', 3: '🐢 dauert' }
export const EFFORT_LABELS: Record<1 | 2 | 3, string> = { 1: '👌 leicht', 2: '🥄 mittel', 3: '💪 aufwendig' }

export function ratingLabel(labels: Record<1 | 2 | 3, string>, r: Rating): string | null {
  return r ? labels[r] : null
}

/** Auswahl: Vorgaben + eigene Werte aus den Gerichten (ohne Dubletten, eigene alphabetisch) */
export function categoryOptions(defaults: readonly string[], used: Array<string | null>): string[] {
  const seen = new Set(defaults.map(normalize))
  const extra: string[] = []
  for (const v of used) {
    const t = v?.trim()
    if (!t || seen.has(normalize(t))) continue
    seen.add(normalize(t))
    extra.push(t)
  }
  extra.sort((a, b) => a.localeCompare(b, 'de'))
  return [...defaults, ...extra]
}

// ---------- Gerichte ----------

export interface RecipeDraft {
  title: string
  ingredients: Ingredient[]
  note: string
  link: string
  speed: Rating
  effort: Rating
  side: string | null
  kind: string | null
  favorite: boolean
  /** Auf der Merkliste „Bald mal wieder“ seit (ISO) bzw. null */
  soon: string | null
}

export const EMPTY_RECIPE: RecipeDraft = {
  title: '',
  ingredients: [],
  note: '',
  link: '',
  speed: null,
  effort: null,
  side: null,
  kind: null,
  favorite: false,
  soon: null,
}

/** Erster Buchstabe groß (Zutaten beim Eintippen), führende Leerzeichen bleiben */
export function capitalizeFirst(text: string): string {
  return text.replace(/^(\s*)(\S)/, (_, space: string, first: string) => space + first.toLocaleUpperCase('de'))
}

/** Leere Zutaten entfernen, Texte trimmen */
export function cleanIngredients(list: Ingredient[]): Ingredient[] {
  return list
    .map((i) => ({ ...i, name: i.name.trim(), quantity: i.quantity.trim() }))
    .filter((i) => i.name)
}

/** Gericht für den Speicherstand aufbereiten */
export function cleanRecipe(d: RecipeDraft): RecipeDraft {
  return {
    ...d,
    title: d.title.trim(),
    note: d.note.trim(),
    link: d.link.trim(),
    side: d.side?.trim() || null,
    kind: d.kind?.trim() || null,
    ingredients: cleanIngredients(d.ingredients),
  }
}

export function sortRecipes(list: Recipe[]): Recipe[] {
  return [...list].sort((a, b) => a.title.localeCompare(b.title, 'de'))
}

/** Durchsuchbarer Text: Name, Zutaten, Notiz, Beilage, Art */
export function recipeHaystack(r: Recipe): string {
  return normalize([r.title, ...r.ingredients.map((i) => i.name), r.note, r.side ?? '', r.kind ?? ''].join('\n'))
}

export interface RecipeFilter {
  query: string
  favorites: boolean
  /** nur Gerichte auf der Merkliste */
  soon: boolean
  side: string | null
  kind: string | null
  /** genau diese Stufe */
  speed: Rating
  effort: Rating
}

export const EMPTY_FILTER: RecipeFilter = { query: '', favorites: false, soon: false, side: null, kind: null, speed: null, effort: null }

/** Anzahl gesetzter Filter (ohne Suchtext und Favoriten) */
export function activeFilterCount(f: RecipeFilter): number {
  return [f.side, f.kind, f.speed, f.effort].filter((v) => v !== null).length
}

const same = (a: string | null, b: string | null) => normalize(a ?? '') === normalize(b ?? '')

/** Nicht gelöschte Gerichte, die zum Filter passen, alphabetisch */
export function filterRecipes(list: Recipe[], f: RecipeFilter): Recipe[] {
  const q = f.query.trim()
  return sortRecipes(
    list.filter(
      (r) =>
        !r.deleted &&
        (!f.favorites || r.favorite) &&
        (!f.soon || !!r.soon) &&
        (f.side === null || same(r.side, f.side)) &&
        (f.kind === null || same(r.kind, f.kind)) &&
        (f.speed === null || r.speed === f.speed) &&
        (f.effort === null || r.effort === f.effort) &&
        (!q || matches(recipeHaystack(r), q)),
    ),
  )
}

/** Suche (für die globale Suche): alle Wörter müssen vorkommen */
export function searchRecipes(list: Recipe[], query: string, limit = 50): Recipe[] {
  if (!query.trim()) return []
  return filterRecipes(list, { ...EMPTY_FILTER, query }).slice(0, limit)
}

/** Merkliste „Bald mal wieder“: zuerst gemerkte zuerst */
export function soonList(list: Recipe[]): Recipe[] {
  return list.filter((r) => !r.deleted && r.soon).sort((a, b) => a.soon!.localeCompare(b.soon!) || a.title.localeCompare(b.title, 'de'))
}

// ---------- Mittagessen ----------

/** Deterministische id: beide Geräte schreiben für denselben Tag denselben Datensatz */
export function mealId(date: string): string {
  return `mittag:${date}`
}

/** Anzeige eines Mittagessens: Gerichtname oder Freitext */
export function mealTitle(meal: Pick<Meal, 'recipeId' | 'text'>, recipes: Map<string, Recipe>): string {
  if (meal.recipeId) return recipes.get(meal.recipeId)?.title ?? 'Unbekanntes Gericht'
  return meal.text
}

/** Mittagessen ohne Inhalt (kein Gericht, kein Text) gilt als nicht geplant */
export function isEmptyMeal(m: Pick<Meal, 'recipeId' | 'text'>): boolean {
  return !m.recipeId && !m.text.trim()
}

/** Montag der Woche */
export function weekStart(date: string): string {
  return periodStartOf(date, 'week')
}

/** Montag bis Sonntag */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** „Diese Woche“, „Nächste Woche“, „Letzte Woche“ oder leer; dazu der Zeitraum „23.11. – 29.11.“ */
export function weekLabel(monday: string, today: string): { relative: string; range: string } {
  const diff = (Date.parse(monday) - Date.parse(weekStart(today))) / 86_400_000 / 7
  const relative = diff === 0 ? 'Diese Woche' : diff === 1 ? 'Nächste Woche' : diff === -1 ? 'Letzte Woche' : ''
  const short = (d: string) => formatYmd(d).slice(0, 6)
  const sunday = addDays(monday, 6)
  return { relative, range: `${short(monday)} – ${short(sunday)}${sunday.slice(0, 4) !== today.slice(0, 4) ? sunday.slice(0, 4) : ''}` }
}

/** Nicht gelöschte, geplante Mittagessen nach Datum */
export function mealsByDate(meals: Meal[]): Map<string, Meal> {
  const out = new Map<string, Meal>()
  for (const m of meals) if (!m.deleted && !isEmptyMeal(m)) out.set(m.date, m)
  return out
}

/** Pro Gericht: zuletzt gegessen (bis einschließlich heute) und nächster geplanter Tag */
export interface RecipeUsage {
  last: string | null
  next: string | null
}

export function recipeUsage(meals: Meal[], today: string): Map<string, RecipeUsage> {
  const out = new Map<string, RecipeUsage>()
  for (const m of meals) {
    if (m.deleted || !m.recipeId) continue
    const u = out.get(m.recipeId) ?? { last: null, next: null }
    if (m.date <= today) {
      if (!u.last || m.date > u.last) u.last = m.date
    } else if (!u.next || m.date < u.next) u.next = m.date
    out.set(m.recipeId, u)
  }
  return out
}

/** Tage zwischen zwei Daten (b − a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

/** „heute“, „gestern“, „vor 5 Tagen“, „vor 3 Wochen“, „noch nie“ */
export function lastEatenLabel(last: string | null, today: string): string {
  if (!last) return 'noch nie'
  const d = daysBetween(last, today)
  if (d <= 0) return 'heute'
  if (d === 1) return 'gestern'
  if (d < 14) return `vor ${d} Tagen`
  if (d < 60) return `vor ${Math.floor(d / 7)} Wochen`
  return `vor ${Math.floor(d / 30)} Monaten`
}

/**
 * Zufallsvorschlag „Was essen wir?“: bevorzugt Gerichte, die mindestens `avoidDays` nicht dran waren
 * und nicht schon geplant sind; gibt es keine, alle. `exclude` = gerade schon vorgeschlagen.
 */
export function pickRandom(
  candidates: Recipe[],
  usage: Map<string, RecipeUsage>,
  today: string,
  opts: { avoidDays?: number; exclude?: string | null; rand?: () => number } = {},
): Recipe | null {
  const { avoidDays = 14, exclude = null, rand = Math.random } = opts
  const pool = candidates.filter((r) => !r.deleted && r.id !== exclude)
  const fresh = pool.filter((r) => {
    const u = usage.get(r.id)
    return !u?.next && (!u?.last || daysBetween(u.last, today) >= avoidDays)
  })
  const from = fresh.length > 0 ? fresh : pool.length > 0 ? pool : candidates.filter((r) => !r.deleted)
  if (from.length === 0) return null
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))]
}

// ---------- Zutaten einkaufen ----------

export interface IngredientNeed {
  /** Vergleichsschlüssel (normalisierter Name) */
  key: string
  name: string
  /** Mengen der einzelnen Gerichte, leere weggelassen */
  quantities: string[]
  /** Gerichte, aus denen die Zutat stammt */
  recipes: string[]
}

/** Zutaten aller geplanten Gerichte von bis (inklusive); gleiche Namen werden zusammengefasst. */
export function collectIngredients(meals: Meal[], recipes: Map<string, Recipe>, from: string, to: string): IngredientNeed[] {
  const out = new Map<string, IngredientNeed>()
  const days = [...mealsByDate(meals).values()].filter((m) => m.date >= from && m.date <= to).sort((a, b) => a.date.localeCompare(b.date))
  for (const m of days) {
    const r = m.recipeId ? recipes.get(m.recipeId) : null
    if (!r) continue
    for (const i of cleanIngredients(r.ingredients)) {
      const key = normalize(i.name).replace(/\s+/g, ' ')
      const need = out.get(key) ?? { key, name: i.name, quantities: [], recipes: [] }
      if (i.quantity) need.quantities.push(i.quantity)
      if (!need.recipes.includes(r.title)) need.recipes.push(r.title)
      out.set(key, need)
    }
  }
  return [...out.values()]
}

/** Menge für den Einkaufszettel: „500 g + 250 g“ */
export function joinQuantities(q: string[]): string {
  return q.join(' + ')
}
