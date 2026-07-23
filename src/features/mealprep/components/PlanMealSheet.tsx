import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { MealType } from '@/types'
import { MEAL_LABELS, MEAL_TYPES } from '@/types'
import { cn } from '@/utils/cn'
import { useRecipes } from '../hooks/useMealPrep'
import { planRecipe } from '../services/mealPrepActions'

interface PlanMealSheetProps {
  /** The day being planned; null closes the sheet. */
  dateKey: string | null
  dayLabel: string
  onClose: () => void
}

export function PlanMealSheet({ dateKey, dayLabel, onClose }: PlanMealSheetProps) {
  const recipes = useRecipes()
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [recipeId, setRecipeId] = useState<string | null>(null)
  const [servings, setServings] = useState(1)

  useEffect(() => {
    if (dateKey) {
      setMealType('dinner')
      setRecipeId(null)
      setServings(1)
    }
  }, [dateKey])

  const add = () => {
    if (!dateKey || !recipeId) return
    void planRecipe(recipeId, dateKey, mealType, servings)
    onClose()
  }

  return (
    <Sheet open={dateKey !== null} onClose={onClose} title={`Plan · ${dayLabel}`}>
      {recipes.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-content-secondary">
          Create a recipe first, then you can add it to your plan.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-content-secondary">Meal</p>
            <div className="flex gap-1.5">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setMealType(meal)}
                  className={cn(
                    'h-9 flex-1 rounded-xl text-[13px] font-semibold transition-colors',
                    meal === mealType
                      ? 'bg-accent text-black'
                      : 'bg-surface-sunken text-content-secondary',
                  )}
                >
                  {MEAL_LABELS[meal]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-content-secondary">Recipe</p>
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {recipes.map((recipe) => {
                const active = recipe.id === recipeId
                return (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      onClick={() => setRecipeId(recipe.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-control px-4 py-3 text-left transition-colors',
                        active ? 'bg-accent-muted' : 'bg-surface-sunken',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{recipe.name}</p>
                        <p className="text-[12px] text-content-tertiary">
                          {Math.round(recipe.calories)} cal · {Math.round(recipe.proteinG)}g
                          protein
                        </p>
                      </div>
                      {active ? (
                        <CheckCircleIcon className="size-5 shrink-0 text-accent" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-content-secondary">Servings</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer servings"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="flex size-9 items-center justify-center rounded-full bg-surface-sunken text-[18px] font-bold"
              >
                −
              </button>
              <span className="w-6 text-center text-[16px] font-semibold tabular-nums">
                {servings}
              </span>
              <button
                type="button"
                aria-label="More servings"
                onClick={() => setServings((s) => Math.min(20, s + 1))}
                className="flex size-9 items-center justify-center rounded-full bg-surface-sunken text-[18px] font-bold"
              >
                +
              </button>
            </div>
          </div>

          <Button size="lg" fullWidth disabled={!recipeId} onClick={add}>
            Add to Plan
          </Button>
        </div>
      )}
    </Sheet>
  )
}
