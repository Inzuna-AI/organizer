// Essensplaner: Daten lesen (Hooks) und ändern (Aktionen).
// Jedes Gericht und jedes Mittagessen ist ein eigener Datensatz und wird beim Sync einzeln zusammengeführt.
import { useMemo } from 'react'
import type { Meal, Recipe } from '@/types/data'
import { nowIso } from '@/lib/dates'
import { newBase, tombstone, touch, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { cleanRecipe, mealId, mealsByDate, sortRecipes, soonList, type RecipeDraft } from './utils'

/** Alle Gerichte inkl. gelöschter (geplante Mittagessen zeigen auch gelöschte Gerichte noch an) */
export function useAllRecipes(): Recipe[] {
  const recipes = useAppStore((s) => s.data?.recipes)
  return useMemo(() => recipes ?? [], [recipes])
}

/** Nicht gelöschte Gerichte, alphabetisch */
export function useRecipes(): Recipe[] {
  const all = useAllRecipes()
  return useMemo(() => sortRecipes(all.filter((r) => !r.deleted)), [all])
}

/** Merkliste „Bald mal wieder“ */
export function useSoonRecipes(): Recipe[] {
  const all = useAllRecipes()
  return useMemo(() => soonList(all), [all])
}

export function useRecipeMap(): Map<string, Recipe> {
  const all = useAllRecipes()
  return useMemo(() => new Map(all.map((r) => [r.id, r])), [all])
}

export function useRecipe(id: string | null): Recipe | null {
  return useAppStore((s) => (id ? (s.data?.recipes?.find((r) => r.id === id && !r.deleted) ?? null) : null))
}

export function useAllMeals(): Meal[] {
  const meals = useAppStore((s) => s.data?.meals)
  return useMemo(() => meals ?? [], [meals])
}

/** Geplante Mittagessen nach Datum */
export function useMealsByDate(): Map<string, Meal> {
  const meals = useAllMeals()
  return useMemo(() => mealsByDate(meals), [meals])
}

export const recipeActions = {
  /** Neues Gericht anlegen, gibt seine id zurück. */
  create(draft: RecipeDraft): string {
    const me = currentPersonId()
    const recipe: Recipe = { ...newBase(me), ...cleanRecipe(draft) }
    updateData((d) => ({ ...d, recipes: [...(d.recipes ?? []), recipe] }))
    return recipe.id
  },

  save(id: string, draft: RecipeDraft) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, recipes: updateById<Recipe>(d.recipes, id, me, cleanRecipe(draft)) }))
  },

  toggleFavorite(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, recipes: updateById<Recipe>(d.recipes, id, me, (r) => ({ favorite: !r.favorite })) }))
  },

  /** Auf die Merkliste „Bald mal wieder“ setzen bzw. herunternehmen */
  toggleSoon(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, recipes: updateById<Recipe>(d.recipes, id, me, (r) => ({ soon: r.soon ? null : nowIso() })) }))
  },

  /** Löschen; bereits geplante Mittagessen zeigen den Namen weiter an */
  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === id ? tombstone(r, me) : r)) }))
  },
}

export interface MealInput {
  recipeId: string | null
  text: string
  note: string
}

/** Mittagessen eines Tages setzen (anlegen, ändern oder einen gelöschten Eintrag wiederbeleben) */
function setMeal(meals: Meal[], date: string, input: MealInput, me: string | null): Meal[] {
  const id = mealId(date)
  const values = { recipeId: input.recipeId, text: input.recipeId ? '' : input.text.trim(), note: input.note.trim() }
  const cur = meals.find((m) => m.id === id)
  if (!cur) return [...meals, { ...newBase(me), id, date, ...values }]
  return meals.map((m) => (m.id === id ? touch(m, me, { ...values, deleted: false }) : m))
}

function clearMeal(meals: Meal[], date: string, me: string | null): Meal[] {
  const id = mealId(date)
  return meals.map((m) => (m.id === id && !m.deleted ? tombstone(m, me) : m))
}

const inputOf = (m: Meal): MealInput => ({ recipeId: m.recipeId, text: m.text, note: m.note })

export const mealActions = {
  set(date: string, input: MealInput) {
    const me = currentPersonId()
    if (!input.recipeId && !input.text.trim()) return mealActions.clear(date)
    updateData((d) => {
      const meals = setMeal(d.meals ?? [], date, input, me)
      // Ein gemerktes Gericht ist mit dem Planen erledigt
      const r = input.recipeId ? d.recipes?.find((x) => x.id === input.recipeId) : null
      const recipes = r?.soon ? updateById<Recipe>(d.recipes, r.id, me, { soon: null }) : d.recipes
      return { ...d, meals, recipes }
    })
  },

  clear(date: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, meals: clearMeal(d.meals ?? [], date, me) }))
  },

  /** Auf einen anderen Tag verschieben; steht dort schon etwas, werden die Tage getauscht. */
  move(from: string, to: string) {
    if (from === to) return
    const me = currentPersonId()
    updateData((d) => {
      const byDate = mealsByDate(d.meals ?? [])
      const a = byDate.get(from)
      if (!a) return d
      const b = byDate.get(to)
      let meals = setMeal(d.meals, to, inputOf(a), me)
      meals = b ? setMeal(meals, from, inputOf(b), me) : clearMeal(meals, from, me)
      return { ...d, meals }
    })
  },
}
