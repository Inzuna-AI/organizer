import { describe, expect, it } from 'vitest'
import type { Meal, Recipe } from '@/types/data'
import {
  capitalizeFirst,
  categoryOptions,
  cleanRecipe,
  collectIngredients,
  DEFAULT_KINDS,
  EMPTY_FILTER,
  EMPTY_RECIPE,
  filterRecipes,
  joinQuantities,
  kindIcon,
  lastEatenLabel,
  mealsByDate,
  mealTitle,
  pickRandom,
  recipeUsage,
  searchRecipes,
  soonList,
  weekDates,
  weekLabel,
  weekStart,
} from './utils'

const base = { updatedAt: '2026-11-01T00:00:00Z', deleted: false, createdBy: null, updatedBy: null }

function recipe(id: string, title: string, extra: Partial<Recipe> = {}): Recipe {
  return { ...base, ...EMPTY_RECIPE, id, title, ...extra }
}

function meal(date: string, recipeId: string | null, text = '', extra: Partial<Meal> = {}): Meal {
  return { ...base, id: `mittag:${date}`, date, recipeId, text, note: '', ...extra }
}

const spaghetti = recipe('r1', 'Spaghetti Bolognese', {
  kind: 'Fleisch',
  side: 'Nudeln',
  speed: 2,
  effort: 1,
  favorite: true,
  ingredients: [
    { id: 'i1', name: 'Spaghetti', quantity: '500 g' },
    { id: 'i2', name: 'Hackfleisch', quantity: '400 g' },
    { id: 'i3', name: 'Zwiebel', quantity: '1' },
  ],
})
const lachs = recipe('r2', 'Lachs mit Kartoffeln', {
  kind: 'Fisch',
  side: 'Kartoffeln',
  speed: 1,
  effort: 2,
  ingredients: [
    { id: 'i4', name: 'Lachsfilet', quantity: '2 Stück' },
    { id: 'i5', name: 'Kartoffeln', quantity: '800 g' },
    { id: 'i6', name: 'zwiebel ', quantity: '' },
  ],
})
const curry = recipe('r3', 'Gemüsecurry', { kind: 'vegan', side: 'Reis', speed: 3, effort: 3 })
const gone = recipe('r4', 'Altes Gericht', { deleted: true })
const all = [curry, lachs, spaghetti, gone]

describe('Kategorien', () => {
  it('Vorgaben plus eigene Werte ohne Dubletten', () => {
    expect(categoryOptions(DEFAULT_KINDS, ['Fisch', 'Wild', null, ' wild ', 'Meeresfrüchte'])).toEqual([
      ...DEFAULT_KINDS,
      'Meeresfrüchte',
      'Wild',
    ])
  })

  it('Symbole zur Art', () => {
    expect(kindIcon('Geflügel')).toBe('🍗')
    expect(kindIcon('Wild')).toBe('')
    expect(kindIcon(null)).toBe('')
  })

  it('capitalizeFirst: erster Buchstabe groß', () => {
    expect(capitalizeFirst('zwiebeln')).toBe('Zwiebeln')
    expect(capitalizeFirst('äpfel')).toBe('Äpfel')
    expect(capitalizeFirst(' ei')).toBe(' Ei')
    expect(capitalizeFirst('500g Hack')).toBe('500g Hack')
    expect(capitalizeFirst('')).toBe('')
  })

  it('cleanRecipe trimmt und entfernt leere Zutaten', () => {
    const r = cleanRecipe({
      ...EMPTY_RECIPE,
      title: ' Suppe ',
      side: '  ',
      ingredients: [
        { id: 'a', name: ' Möhren ', quantity: ' 3 ' },
        { id: 'b', name: '', quantity: '1' },
      ],
    })
    expect(r.title).toBe('Suppe')
    expect(r.side).toBeNull()
    expect(r.ingredients).toEqual([{ id: 'a', name: 'Möhren', quantity: '3' }])
  })
})

describe('filterRecipes', () => {
  it('ohne Filter: alle nicht gelöschten, alphabetisch', () => {
    expect(filterRecipes(all, EMPTY_FILTER).map((r) => r.id)).toEqual(['r3', 'r2', 'r1'])
  })

  it('nach Art, Beilage, Zeit, Aufwand und Favoriten', () => {
    expect(filterRecipes(all, { ...EMPTY_FILTER, kind: 'fisch' }).map((r) => r.id)).toEqual(['r2'])
    expect(filterRecipes(all, { ...EMPTY_FILTER, side: 'Nudeln' }).map((r) => r.id)).toEqual(['r1'])
    expect(filterRecipes(all, { ...EMPTY_FILTER, speed: 1 }).map((r) => r.id)).toEqual(['r2'])
    expect(filterRecipes(all, { ...EMPTY_FILTER, effort: 3 }).map((r) => r.id)).toEqual(['r3'])
    expect(filterRecipes(all, { ...EMPTY_FILTER, favorites: true }).map((r) => r.id)).toEqual(['r1'])
  })

  it('Suche findet auch Zutaten, Umlaute egal', () => {
    expect(filterRecipes(all, { ...EMPTY_FILTER, query: 'hack' }).map((r) => r.id)).toEqual(['r1'])
    expect(searchRecipes(all, 'gemuse')).toEqual([curry])
    expect(searchRecipes(all, ' ')).toEqual([])
  })
})

describe('Merkliste', () => {
  it('nur gemerkte, nicht gelöschte, zuerst gemerkte zuerst; filterbar', () => {
    const a = recipe('a', 'A', { soon: '2026-11-22T10:00:00Z' })
    const b2 = recipe('b', 'B', { soon: '2026-11-20T10:00:00Z' })
    const c = recipe('c', 'C', { soon: '2026-11-19T10:00:00Z', deleted: true })
    const d = recipe('d', 'D')
    expect(soonList([a, b2, c, d]).map((r) => r.id)).toEqual(['b', 'a'])
    expect(filterRecipes([a, b2, c, d], { ...EMPTY_FILTER, soon: true }).map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('Wochenplan', () => {
  it('Woche von Montag bis Sonntag', () => {
    expect(weekStart('2026-11-26')).toBe('2026-11-23')
    expect(weekStart('2026-11-29')).toBe('2026-11-23')
    expect(weekDates('2026-11-23')).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ])
  })

  it('Bezeichnung der Woche', () => {
    expect(weekLabel('2026-11-23', '2026-11-25')).toEqual({ relative: 'Diese Woche', range: '23.11. – 29.11.' })
    expect(weekLabel('2026-11-30', '2026-11-25').relative).toBe('Nächste Woche')
    expect(weekLabel('2026-11-16', '2026-11-25').relative).toBe('Letzte Woche')
    expect(weekLabel('2026-12-28', '2026-11-25')).toEqual({ relative: '', range: '28.12. – 03.01.2027' })
  })

  it('mealsByDate ignoriert gelöschte und leere Einträge', () => {
    const m = mealsByDate([meal('2026-11-23', 'r1'), meal('2026-11-24', null, ''), meal('2026-11-25', 'r2', '', { deleted: true })])
    expect([...m.keys()]).toEqual(['2026-11-23'])
  })

  it('Titel: Gericht oder Freitext', () => {
    const map = new Map(all.map((r) => [r.id, r]))
    expect(mealTitle(meal('2026-11-23', 'r1'), map)).toBe('Spaghetti Bolognese')
    expect(mealTitle(meal('2026-11-23', null, 'Reste'), map)).toBe('Reste')
  })
})

describe('Verlauf und Zufallsvorschlag', () => {
  const meals = [
    meal('2026-11-01', 'r1'),
    meal('2026-11-20', 'r1'),
    meal('2026-11-27', 'r2'),
    meal('2026-10-01', 'r3'),
  ]
  const usage = recipeUsage(meals, '2026-11-23')

  it('zuletzt gegessen und nächster geplanter Tag', () => {
    expect(usage.get('r1')).toEqual({ last: '2026-11-20', next: null })
    expect(usage.get('r2')).toEqual({ last: null, next: '2026-11-27' })
  })

  it('Bezeichnung „zuletzt“', () => {
    expect(lastEatenLabel(null, '2026-11-23')).toBe('noch nie')
    expect(lastEatenLabel('2026-11-23', '2026-11-23')).toBe('heute')
    expect(lastEatenLabel('2026-11-22', '2026-11-23')).toBe('gestern')
    expect(lastEatenLabel('2026-11-20', '2026-11-23')).toBe('vor 3 Tagen')
    expect(lastEatenLabel('2026-11-02', '2026-11-23')).toBe('vor 3 Wochen')
    expect(lastEatenLabel('2026-08-01', '2026-11-23')).toBe('vor 3 Monaten')
  })

  it('bevorzugt Gerichte, die länger nicht dran und nicht geplant sind', () => {
    // r1 vor 3 Tagen, r2 geplant → nur r3 kommt infrage
    expect(pickRandom(all, usage, '2026-11-23', { rand: () => 0.99 })?.id).toBe('r3')
  })

  it('ohne passende frische Gerichte: aus allen, ohne den gerade gezeigten', () => {
    expect(pickRandom([spaghetti, lachs], usage, '2026-11-23', { exclude: 'r1', rand: () => 0 })?.id).toBe('r2')
    expect(pickRandom([], usage, '2026-11-23')).toBeNull()
  })
})

describe('collectIngredients', () => {
  it('fasst gleiche Zutaten mehrerer Gerichte zusammen', () => {
    const map = new Map(all.map((r) => [r.id, r]))
    const meals = [
      meal('2026-11-23', 'r1'),
      meal('2026-11-24', null, 'Reste'),
      meal('2026-11-25', 'r2'),
      meal('2026-12-01', 'r3'),
    ]
    const need = collectIngredients(meals, map, '2026-11-23', '2026-11-29')
    expect(need.map((n) => n.name)).toEqual(['Spaghetti', 'Hackfleisch', 'Zwiebel', 'Lachsfilet', 'Kartoffeln'])
    const zwiebel = need.find((n) => n.key === 'zwiebel')!
    expect(zwiebel.quantities).toEqual(['1'])
    expect(zwiebel.recipes).toEqual(['Spaghetti Bolognese', 'Lachs mit Kartoffeln'])
    expect(joinQuantities(['500 g', '250 g'])).toBe('500 g + 250 g')
  })
})
