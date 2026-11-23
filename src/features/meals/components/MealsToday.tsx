import { Link } from 'react-router'
import { addDays } from '@/lib/dates'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { useMealsByDate, useRecipeMap, useRecipes } from '../store'
import { kindIcon, mealTitle } from '../utils'

interface Props {
  today: string
  open: boolean
  onToggle: () => void
}

/** Abschnitt in „Heute“: Mittagessen heute und morgen (nur, wenn der Essensplaner genutzt wird) */
export function MealsTodaySection({ today, open, onToggle }: Props) {
  const byDate = useMealsByDate()
  const recipes = useRecipeMap()
  const hasRecipes = useRecipes().length > 0
  const tomorrow = addDays(today, 1)
  const days = [
    { date: today, label: 'Heute' },
    { date: tomorrow, label: 'Morgen' },
  ]
  if (!hasRecipes && !byDate.has(today) && !byDate.has(tomorrow)) return null

  return (
    <CollapsibleSection
      title="Mittagessen"
      open={open}
      onToggle={onToggle}
      extra={
        <Link to="/essen" className="text-xs text-brand-700">
          Wochenplan
        </Link>
      }
    >
      <ul className="grid grid-cols-2 gap-2">
        {days.map(({ date, label }) => {
          const meal = byDate.get(date)
          const recipe = meal?.recipeId ? recipes.get(meal.recipeId) : null
          return (
            <li key={date}>
              <Link
                to={`/essen/tag/${date}`}
                className="flex min-h-16 flex-col justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 active:opacity-80"
              >
                <span className="text-xs text-slate-500">{label}</span>
                {meal ? (
                  <span className="text-sm font-medium break-words">
                    {recipe?.kind && kindIcon(recipe.kind) ? `${kindIcon(recipe.kind)} ` : '🍽️ '}
                    {mealTitle(meal, recipes)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">＋ planen</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </CollapsibleSection>
  )
}
